const User = require('../models/User');
const Notification = require('../models/Notification');

exports.getUserProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username: username.toLowerCase() })
      .populate('followers', 'username name profileImage isVerified')
      .populate('following', 'username name profileImage isVerified');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);
    const user = isObjectId
      ? await User.findById(id)
          .populate('followers', 'username name profileImage isVerified')
          .populate('following', 'username name profileImage isVerified')
      : await User.findOne({ username: id.toLowerCase() })
          .populate('followers', 'username name profileImage isVerified')
          .populate('following', 'username name profileImage isVerified');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentUserId = req.user?.id;
    if (currentUserId) {
      const currentUser = await User.findById(currentUserId);
      if (currentUser) {
        const userObj = user.toObject();
        userObj.isFollowing = currentUser.following.some(
          (fid) => fid.toString() === user._id.toString()
        );
        return res.status(200).json(userObj);
      }
    }

    return res.status(200).json(user);
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

    const updatedUser = await User.findById(user._id)
      .populate('followers', 'username name profileImage isVerified')
      .populate('following', 'username name profileImage isVerified');

    return res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser,
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

    const isFollowing = currentUser.following.includes(targetUserId);

    if (isFollowing) {
      currentUser.following = currentUser.following.filter((id) => id.toString() !== targetUserId);
      targetUser.followers = targetUser.followers.filter((id) => id.toString() !== currentUserId.toString());
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
      .select('username name profileImage isVerified followers')
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
      .select('username name profileImage isVerified followers')
      .limit(5)
      .sort({ 'followers.length': -1 });

    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
