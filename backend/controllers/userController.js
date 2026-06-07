const User = require('../models/User');
const Post = require('../models/Post');
const Notification = require('../models/Notification');

// Helper: pick a user by id or username, return null if not found.
const findUser = async (idOrUsername) => {
  if (!idOrUsername) return null;
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrUsername);
  if (isObjectId) return await User.findById(idOrUsername);
  return await User.findOne({ username: idOrUsername.toLowerCase() });
};

// Enrich a user object with the fields the frontend needs and strip
// the heavy `followers` / `following` arrays (callers should use the
// dedicated paginated endpoints instead).
const buildProfileResponse = (user, currentUserId) => {
  const obj = user.toObject ? user.toObject() : { ...user };
  obj.followersCount = (obj.followers || []).length;
  obj.followingCount = (obj.following || []).length;
  // The frontend never needs the full arrays in the profile payload.
  obj.followers = [];
  obj.following = [];
  if (currentUserId) {
    obj.isFollowing = (user.followers || []).some(
      (fid) => fid.toString() === currentUserId.toString(),
    );
  } else {
    obj.isFollowing = false;
  }
  return obj;
};

// GET /api/users/:idOrUsername
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await findUser(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Compute post count separately so we don't depend on a virtual.
    const postsCount = await Post.countDocuments({ userId: user._id });
    const obj = buildProfileResponse(user, req.user?.id);
    obj.postsCount = postsCount;
    return res.status(200).json(obj);
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/users/profile/:username  (kept for backwards compat — delegates)
exports.getUserProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const postsCount = await Post.countDocuments({ userId: user._id });
    const obj = buildProfileResponse(user, req.user?.id);
    obj.postsCount = postsCount;
    return res.status(200).json(obj);
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Helper for paginated follower/following lists. Returns enriched user
// objects with an `isFollowing` flag indicating whether the requester
// follows each person.
const buildFollowListResponse = async (user, kind, page, limit, requesterId) => {
  const ids = kind === 'followers' ? user.followers : user.following;
  const total = ids.length;
  const skip = (page - 1) * limit;
  const pageIds = ids.slice(skip, skip + limit);

  const users = await User.find({ _id: { $in: pageIds } })
    .select('username name profileImage isVerified');

  // Preserve the original order of the array.
  const userMap = new Map(users.map((u) => [u._id.toString(), u]));
  const ordered = pageIds
    .map((id) => userMap.get(id.toString()))
    .filter(Boolean);

  // Compute who the requester follows so each entry can carry the flag.
  let requesterFollowingIds = new Set();
  if (requesterId) {
    const me = await User.findById(requesterId).select('following');
    if (me) {
      requesterFollowingIds = new Set(me.following.map((id) => id.toString()));
    }
  }

  const enriched = ordered.map((u) => {
    const o = u.toObject();
    o.isFollowing = requesterFollowingIds.has(u._id.toString());
    return o;
  });

  return {
    users: enriched,
    total,
    page,
    limit,
    hasMore: skip + pageIds.length < total,
  };
};

// GET /api/users/:id/followers?page=1&limit=20
exports.getFollowers = async (req, res) => {
  try {
    const user = await findUser(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));

    const data = await buildFollowListResponse(
      user,
      'followers',
      page,
      limit,
      req.user?.id,
    );
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/users/:id/following?page=1&limit=20
exports.getFollowing = async (req, res) => {
  try {
    const user = await findUser(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));

    const data = await buildFollowListResponse(
      user,
      'following',
      page,
      limit,
      req.user?.id,
    );
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateUserProfile = async (req, res) => {
  try {
    const { name, bio, username } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (username && username.toLowerCase() !== user.username) {
      const usernameExists = await User.findOne({ username: username.toLowerCase() });
      if (usernameExists) {
        return res.status(400).json({ message: 'Username is already taken' });
      }
      user.username = username.toLowerCase();
    }

    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;

    if (req.file) {
      user.profileImage = req.file.path;
    }

    await user.save();

    const updatedUser = await User.findById(user._id);

    return res.status(200).json({
      message: 'Profile updated successfully',
      user: buildProfileResponse(updatedUser, req.user.id),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error during profile update', error: error.message });
  }
};

exports.followUnfollowUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user.id;

    if (targetUserId === currentUserId.toString()) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser || !currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isFollowing = currentUser.following.some(
      (id) => id.toString() === targetUserId.toString(),
    );

    if (isFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter(
        (id) => id.toString() !== targetUserId.toString(),
      );
      targetUser.followers = targetUser.followers.filter(
        (id) => id.toString() !== currentUserId.toString(),
      );
      await currentUser.save();
      await targetUser.save();

      await Notification.findOneAndDelete({
        senderId: currentUserId,
        receiverId: targetUserId,
        type: 'follow',
      });

      if (global.io) {
        global.io.emit('followUpdate', {
          targetUserId,
          currentUserId,
          isFollowing: false,
          followersCount: targetUser.followers.length,
          followingCount: currentUser.following.length,
        });
      }

      return res.status(200).json({
        message: 'Unfollowed successfully',
        isFollowing: false,
        followersCount: targetUser.followers.length,
        followingCount: currentUser.following.length,
      });
    } else {
      // Follow
      currentUser.following.push(targetUserId);
      targetUser.followers.push(currentUserId);
      await currentUser.save();
      await targetUser.save();

      const notification = await Notification.create({
        senderId: currentUserId,
        receiverId: targetUserId,
        type: 'follow',
      });

      const populatedNotif = await Notification.findById(notification._id)
        .populate('senderId', 'username name profileImage isVerified')
        .exec();

      if (global.io) {
        const targetSocketId = global.onlineUsers.get(targetUserId);
        if (targetSocketId) {
          global.io.to(targetSocketId).emit('newNotification', populatedNotif);
        }

        global.io.emit('followUpdate', {
          targetUserId,
          currentUserId,
          isFollowing: true,
          followersCount: targetUser.followers.length,
          followingCount: currentUser.following.length,
          follower: {
            _id: currentUser._id,
            username: currentUser.username,
            name: currentUser.name,
            profileImage: currentUser.profileImage,
            isVerified: currentUser.isVerified,
          },
        });
      }

      return res.status(200).json({
        message: 'Followed successfully',
        isFollowing: true,
        followersCount: targetUser.followers.length,
        followingCount: currentUser.following.length,
      });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(200).json([]);
    }

    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } },
      ],
    })
      .select('username name profileImage isVerified')
      .limit(20);

    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getSuggestedUsers = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const currentUser = await User.findById(currentUserId);

    const excludeUsers = [currentUserId, ...currentUser.following];

    const users = await User.find({ _id: { $nin: excludeUsers } })
      .select('username name profileImage isVerified')
      .limit(5)
      .sort({ 'followers.length': -1 });

    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
