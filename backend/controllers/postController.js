const Post = require('../models/Post');
const User = require('../models/User');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const { cloudinary } = require('../config/cloudinary');

// Helper function to enrich posts with user-specific data
const enrichPosts = async (posts, currentUserId) => {
  if (!posts || !posts.length) return posts;

  const userIdStr = currentUserId.toString();

  // Get user's saved posts + who they follow so we can attach
  // isSaved + isFollowing (on the post's author) to each post.
  const currentUser = await User.findById(currentUserId).select('savedPosts following');
  const savedPostIds = new Set(
    (currentUser?.savedPosts || []).map((id) => id.toString()),
  );
  const followingIds = new Set(
    (currentUser?.following || []).map((id) => id.toString()),
  );

  return posts.map((post) => {
    const postObj = post.toObject ? post.toObject() : post;

    // Compute isLiked - handle both populated subdocuments and raw ObjectIds
    const isLiked = (post.likes || []).some((like) => {
      const likeId = like && like._id ? like._id.toString() : like.toString();
      return likeId === userIdStr;
    });

    // Compute isSaved
    const isSaved = savedPostIds.has(post._id.toString());

    // Build the `user` object that the frontend uses. We always expose
    // a normalized user with `isFollowing` so the PostCard follow button
    // can show the right state.
    const populatedUser = postObj.userId && typeof postObj.userId === 'object'
      ? { ...postObj.userId }
      : null;
    const authorId = (populatedUser?._id || postObj.userId || '').toString();
    const userForClient = populatedUser
      ? { ...populatedUser, isFollowing: followingIds.has(authorId) }
      : { isFollowing: followingIds.has(authorId) };

    // Ensure likes are populated with user objects
    const likes = post.likes && post.likes.length > 0 && typeof post.likes[0] === 'object' && post.likes[0]._id
      ? post.likes
      : post.likes; // Will be populated by caller

    return {
      ...postObj,
      // Always expose unified media fields. For legacy posts, fall back to the
      // existing `image` field so the frontend receives a complete picture.
      mediaUrl: postObj.mediaUrl || postObj.image || '',
      mediaType: postObj.mediaType || 'image',
      thumbnail: postObj.thumbnail || (postObj.mediaType === 'image' ? (postObj.mediaUrl || postObj.image) : ''),
      videoDuration: postObj.videoDuration || null,
      user: userForClient, // Normalize to 'user' for frontend
      userId: authorId,
      likes,
      likesCount: (post.likes || []).length,
      isLiked,
      isSaved,
      commentsCount: postObj.commentsCount || 0,
    };
  });
};

// Helper to enrich a single post
const enrichPost = async (post, currentUserId) => {
  if (!post) return post;

  const userIdStr = currentUserId.toString();

  const currentUser = await User.findById(currentUserId).select('savedPosts following');
  const savedPostIds = new Set(
    (currentUser?.savedPosts || []).map((id) => id.toString()),
  );
  const followingIds = new Set(
    (currentUser?.following || []).map((id) => id.toString()),
  );

  const postObj = post.toObject ? post.toObject() : post;

  // Compute isLiked - handle both populated subdocuments and raw ObjectIds
  const isLiked = (post.likes || []).some((like) => {
    const likeId = like && like._id ? like._id.toString() : like.toString();
    return likeId === userIdStr;
  });
  const isSaved = savedPostIds.has(post._id.toString());

  // Build the `user` object with isFollowing
  const populatedUser = postObj.userId && typeof postObj.userId === 'object'
    ? { ...postObj.userId }
    : null;
  const authorId = (populatedUser?._id || postObj.userId || '').toString();
  const userForClient = populatedUser
    ? { ...populatedUser, isFollowing: followingIds.has(authorId) }
    : { isFollowing: followingIds.has(authorId) };

  return {
    ...postObj,
    mediaUrl: postObj.mediaUrl || postObj.image || '',
    mediaType: postObj.mediaType || 'image',
    thumbnail: postObj.thumbnail || (postObj.mediaType === 'image' ? (postObj.mediaUrl || postObj.image) : ''),
    videoDuration: postObj.videoDuration || null,
    user: userForClient,
    userId: authorId,
    likes: post.likes,
    likesCount: (post.likes || []).length,
    isLiked,
    isSaved,
    commentsCount: postObj.commentsCount || 0,
  };
};

exports.createPost = async (req, res) => {
  try {
    const { caption } = req.body;
    const mediaKind = req.body.mediaKind || (req.file?.mimetype?.startsWith('video/') ? 'video' : 'image');

    if (!req.file) {
      return res.status(400).json({ message: 'Media file is required' });
    }

    let mediaUrl = req.file.path || req.file.url || '';
    let thumbnail = '';
    let videoDuration = null;
    let videoWidth = null;
    let videoHeight = null;
    let mediaType = 'image';

    if (mediaKind === 'video') {
      mediaType = 'video';

      const publicId = req.file.filename || req.file.public_id;

      if (publicId) {
        try {
          const details = await cloudinary.api.resource(publicId, {
            resource_type: 'video',
            image_metadata: true,
            colors: false,
          });
          if (Array.isArray(details.eager) && details.eager.length > 0) {
            thumbnail = details.eager[0].secure_url || details.eager[0].url || '';
          }
          videoDuration = details.duration || null;
          videoWidth = details.width || null;
          videoHeight = details.height || null;
        } catch (err) {
          console.warn('Could not fetch video metadata from Cloudinary:', err.message);
        }
      }

      if (!thumbnail && publicId) {
        thumbnail = cloudinary.url(publicId, {
          resource_type: 'video',
          format: 'jpg',
          transformation: [
            { width: 720, height: 720, crop: 'fill', gravity: 'auto' },
            { start_offset: '2' },
          ],
        });
      }

      if (req.body.videoDuration) {
        const parsed = parseFloat(req.body.videoDuration);
        if (!Number.isNaN(parsed)) {
          videoDuration = videoDuration || parsed;
        }
      }

      if (videoDuration && videoDuration > 60) {
        try {
          if (publicId) {
            await cloudinary.uploader.destroy(publicId, { resource_type: 'video', invalidate: true });
          }
        } catch (_) {}
        return res.status(400).json({
          message: 'Video is longer than 60 seconds. Please trim it before uploading.',
        });
      }
    } else {
      thumbnail = mediaUrl;
    }

    const post = await Post.create({
      userId: req.user.id,
      image: mediaUrl,
      mediaUrl,
      mediaType,
      thumbnail,
      videoDuration,
      videoWidth,
      videoHeight,
      caption: caption || '',
    });

    const populatedPost = await Post.findById(post._id).populate(
      'userId',
      'username name profileImage isVerified'
    );

    const enrichedPost = await enrichPost(populatedPost, req.user.id);

    if (global.io) {
      global.io.emit('newPost', enrichedPost);
    }

    return res.status(201).json({
      message: 'Post created successfully',
      post: enrichedPost,
    });
  } catch (error) {
    console.error('Create Post Error:', error);
    return res.status(500).json({ message: 'Server error during post creation', error: error.message });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'You are not authorized to delete this post' });
    }

    await Comment.deleteMany({ postId: post._id });
    await Notification.deleteMany({ postId: post._id });
    await Post.findByIdAndDelete(req.params.id);

    if (global.io) {
      global.io.emit('postDeleted', { postId: req.params.id });
    }

    return res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete Post Error:', error);
    return res.status(500).json({ message: 'Server error during post deletion', error: error.message });
  }
};

exports.getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('userId', 'username name profileImage isVerified')
      .populate('likes', 'username name profileImage isVerified');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const enrichedPost = await enrichPost(post, req.user.id);

    return res.status(200).json(enrichedPost);
  } catch (error) {
    console.error('Get Post By ID Error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.likeUnlikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const userId = req.user.id;

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const isLiked = post.likes.some((id) => id.toString() === userId.toString());

    if (isLiked) {
      post.likes.pull(userId);
      await post.save();

      await Notification.findOneAndDelete({
        senderId: userId,
        receiverId: post.userId,
        postId: post._id,
        type: 'like',
      });

      const updatedPost = await Post.findById(post._id)
        .populate('userId', 'username name profileImage isVerified')
        .populate('likes', 'username name profileImage isVerified');

      const enrichedPost = await enrichPost(updatedPost, userId);

      if (global.io) {
        global.io.emit('likeUpdate', {
          postId: post._id,
          likes: enrichedPost.likes,
          likesCount: enrichedPost.likesCount,
          isLiked: false,
        });
      }

      return res.status(200).json({
        message: 'Post unliked',
        likes: enrichedPost.likes,
        likesCount: enrichedPost.likesCount,
        isLiked: false,
      });
    } else {
      if (!post.likes.includes(userId)) {
        post.likes.addToSet(userId);
        await post.save();
      }

      if (post.userId.toString() !== userId.toString()) {
        const notification = await Notification.create({
          senderId: userId,
          receiverId: post.userId,
          postId: post._id,
          type: 'like',
        });

        const populatedNotif = await Notification.findById(notification._id)
          .populate('senderId', 'username name profileImage isVerified')
          .populate('postId', 'image caption')
          .exec();

        if (global.io) {
          const targetSocketId = global.onlineUsers.get(post.userId.toString());
          if (targetSocketId) {
            global.io.to(targetSocketId).emit('newNotification', populatedNotif);
          }
        }
      }

      const updatedPost = await Post.findById(post._id)
        .populate('userId', 'username name profileImage isVerified')
        .populate('likes', 'username name profileImage isVerified');

      const enrichedPost = await enrichPost(updatedPost, userId);

      if (global.io) {
        global.io.emit('likeUpdate', {
          postId: post._id,
          likes: enrichedPost.likes,
          likesCount: enrichedPost.likesCount,
          isLiked: true,
        });
      }

      return res.status(200).json({
        message: 'Post liked',
        likes: enrichedPost.likes,
        likesCount: enrichedPost.likesCount,
        isLiked: true,
      });
    }
  } catch (error) {
    console.error('Like/Unlike Error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.commentOnPost = async (req, res) => {
  try {
    const { comment } = req.body;
    const postId = req.params.id;
    const userId = req.user.id;

    if (!comment) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const newComment = await Comment.create({
      userId,
      postId,
      comment,
    });

    post.commentsCount += 1;
    await post.save();

    const populatedComment = await Comment.findById(newComment._id).populate(
      'userId',
      'username name profileImage isVerified'
    );

    if (global.io) {
      global.io.emit('newComment', {
        postId: post._id,
        comment: populatedComment,
        commentsCount: post.commentsCount,
      });
    }

    if (post.userId.toString() !== userId.toString()) {
      const notification = await Notification.create({
        senderId: userId,
        receiverId: post.userId,
        postId,
        type: 'comment',
      });

      const populatedNotif = await Notification.findById(notification._id)
        .populate('senderId', 'username name profileImage isVerified')
        .populate('postId', 'image caption')
        .exec();

      if (global.io) {
        const targetSocketId = global.onlineUsers.get(post.userId.toString());
        if (targetSocketId) {
          global.io.to(targetSocketId).emit('newNotification', populatedNotif);
        }
      }
    }

    return res.status(201).json({
      message: 'Comment added successfully',
      comment: populatedComment,
      commentsCount: post.commentsCount,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getPostComments = async (req, res) => {
  try {
    const comments = await Comment.find({ postId: req.params.id })
      .populate('userId', 'username name profileImage isVerified')
      .sort({ createdAt: -1 });

    return res.status(200).json(comments);
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'You can only delete your own comments' });
    }

    const postId = comment.postId;

    await Comment.findByIdAndDelete(req.params.commentId);

    const post = await Post.findById(postId);
    if (post && post.commentsCount > 0) {
      post.commentsCount -= 1;
      await post.save();
    }

    if (global.io) {
      global.io.emit('commentDeleted', {
        postId: postId.toString(),
        commentId: req.params.commentId,
        commentsCount: post ? post.commentsCount : 0,
      });
    }

    return res.status(200).json({
      message: 'Comment deleted successfully',
      commentsCount: post ? post.commentsCount : 0,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getHomeFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const currentUser = await User.findById(req.user.id);

    const feedUserIds = [...currentUser.following, req.user.id];

    let posts = await Post.find({ userId: { $in: feedUserIds } })
      .populate('userId', 'username name profileImage isVerified')
      .populate('likes', 'username name profileImage isVerified')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    if (posts.length === 0 && page === 1) {
      posts = await Post.find()
        .populate('userId', 'username name profileImage isVerified')
        .populate('likes', 'username name profileImage isVerified')
        .sort({ createdAt: -1 })
        .limit(limit);
    }

    const enrichedPosts = await enrichPosts(posts, req.user.id);

    return res.status(200).json(enrichedPosts);
  } catch (error) {
    console.error('Get Home Feed Error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getExploreFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ userId: { $ne: req.user.id } })
      .populate('userId', 'username name profileImage isVerified')
      .populate('likes', 'username name profileImage isVerified')
      .sort({ 'likes.length': -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const enrichedPosts = await enrichPosts(posts, req.user.id);

    return res.status(200).json(enrichedPosts);
  } catch (error) {
    console.error('Get Explore Feed Error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getUserPosts = async (req, res) => {
  try {
    const { username } = req.params;
    const isObjectId = username.match(/^[0-9a-fA-F]{24}$/);
    const user = isObjectId
      ? await User.findById(username)
      : await User.findOne({ username: username.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const posts = await Post.find({ userId: user._id })
      .populate('userId', 'username name profileImage isVerified')
      .populate('likes', 'username name profileImage isVerified')
      .sort({ createdAt: -1 });

    const enrichedPosts = await enrichPosts(posts, req.user.id);

    return res.status(200).json(enrichedPosts);
  } catch (error) {
    console.error('Get User Posts Error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.toggleSavePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const user = await User.findById(req.user.id);
    const isSaved = user.savedPosts.includes(post._id);

    if (isSaved) {
      user.savedPosts = user.savedPosts.filter((id) => id.toString() !== post._id.toString());
      await user.save();
      return res.status(200).json({ message: 'Post unsaved', saved: false, savedPosts: user.savedPosts });
    } else {
      user.savedPosts.push(post._id);
      await user.save();
      return res.status(200).json({ message: 'Post saved successfully', saved: true, savedPosts: user.savedPosts });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getSavedPosts = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'savedPosts',
      populate: {
        path: 'userId',
        select: 'username name profileImage isVerified',
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const saved = [...user.savedPosts].reverse();

    return res.status(200).json(saved);
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getTrendingHashtags = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const trending = await Post.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      { $unwind: '$hashtags' },
      { $group: { _id: '$hashtags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    return res.status(200).json(trending.map((t) => ({ tag: t._id, count: t.count })));
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
