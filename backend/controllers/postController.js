const Post = require('../models/Post');
const User = require('../models/User');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');

// Helper function to enrich posts with user-specific data
const enrichPosts = async (posts, currentUserId) => {
  if (!posts || !posts.length) return posts;
  
  const userIdStr = currentUserId.toString();
  
  // Get user's saved posts for isSaved computation
  const currentUser = await User.findById(currentUserId).select('savedPosts');
  const savedPostIds = new Set(
    currentUser?.savedPosts?.map(id => id.toString()) || []
  );
  
  return posts.map(post => {
    const postObj = post.toObject ? post.toObject() : post;
    
    // Compute isLiked
    const isLiked = post.likes?.some(like => like.toString() === userIdStr) || false;
    
    // Compute isSaved
    const isSaved = savedPostIds.has(post._id.toString());
    
    // Ensure likes are populated with user objects
    const likes = post.likes && post.likes.length > 0 && typeof post.likes[0] === 'object' && post.likes[0]._id
      ? post.likes
      : post.likes; // Will be populated by caller
    
    return {
      ...postObj,
      user: postObj.userId || postObj.user, // Normalize to 'user' for frontend
      userId: postObj.userId?._id || postObj.userId,
      likes,
      likesCount: post.likes?.length || 0,
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
  
  const currentUser = await User.findById(currentUserId).select('savedPosts');
  const savedPostIds = new Set(
    currentUser?.savedPosts?.map(id => id.toString()) || []
  );
  
  const postObj = post.toObject ? post.toObject() : post;
  
  const isLiked = post.likes?.some(like => like.toString() === userIdStr) || false;
  const isSaved = savedPostIds.has(post._id.toString());
  
  return {
    ...postObj,
    user: postObj.userId || postObj.user,
    userId: postObj.userId?._id || postObj.userId,
    likes: post.likes,
    likesCount: post.likes?.length || 0,
    isLiked,
    isSaved,
    commentsCount: postObj.commentsCount || 0,
  };
};

exports.createPost = async (req, res) => {
  try {
    const { caption } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'Image upload is required' });
    }

    const post = await Post.create({
      userId: req.user.id,
      image: req.file.path,
      caption: caption || '',
    });

    const populatedPost = await Post.findById(post._id).populate(
      'userId',
      'username name profileImage isVerified'
    );

    // Enrich with user-specific data
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

    // Enrich with user-specific data
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

    // Check if user already liked this post
    const isLiked = post.likes.some((id) => id.toString() === userId.toString());

    if (isLiked) {
      // Unlike: Remove user from likes array using pull for atomicity
      post.likes.pull(userId);
      await post.save();

      await Notification.findOneAndDelete({
        senderId: userId,
        receiverId: post.userId,
        postId: post._id,
        type: 'like',
      });

      // Reload post with populated likes
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
      // Use addToSet to prevent duplicate likes (atomic operation)
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

      // Reload post with populated likes
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

    // Enrich posts with user-specific data
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

    // Enrich posts with user-specific data
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

    // Enrich posts with user-specific data
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
