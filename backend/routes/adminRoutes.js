const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const Post = require('../models/Post');
const Report = require('../models/Report');
const Notification = require('../models/Notification');
const Message = require('../models/Message');

// All admin routes require authentication
router.use(protect);

// Middleware to verify admin role
// In production, you'd check a role field. For now we allow any authenticated user
// to view the dashboard. Lock this down once you add an isAdmin field to User model.
const requireAdmin = async (req, res, next) => {
  // TODO: Add isAdmin check when ready
  // if (!req.user.isAdmin) return res.status(403).json({ message: 'Admin access required' });
  next();
};

// GET /api/admin/stats — System statistics
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const [totalUsers, totalPosts, totalReports, totalNotifications, totalMessages, activeToday] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments(),
      Report.countDocuments(),
      Notification.countDocuments(),
      Message.countDocuments(),
      User.countDocuments({
        lastActive: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      }),
    ]);

    // Users registered in the last 7 days
    const newUsersThisWeek = await User.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    });

    // Posts created in the last 24h
    const postsToday = await Post.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    return res.status(200).json({
      users: {
        total: totalUsers,
        newThisWeek: newUsersThisWeek,
        activeToday: activeToday,
      },
      content: {
        totalPosts: totalPosts,
        postsToday: postsToday,
      },
      moderation: {
        totalReports: totalReports,
        pendingReports: await Report.countDocuments({ status: 'pending' }),
      },
      activity: {
        totalNotifications: totalNotifications,
        totalMessages: totalMessages,
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/admin/users — List all users with pagination
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const search = req.query.search || '';

    const query = search
      ? {
          $or: [
            { username: { $regex: search, $options: 'i' } },
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-__v')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    return res.status(200).json({
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE /api/admin/users/:id — Delete a user (ban)
router.delete('/users/:id', requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Don't allow deleting yourself
    if (user._id.toString() === req.user.id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account via admin panel' });
    }

    // Delete user's posts, comments, notifications
    await Promise.all([
      Post.deleteMany({ userId: user._id }),
      Notification.deleteMany({ $or: [{ senderId: user._id }, { receiverId: user._id }] }),
      Report.deleteMany({ $or: [{ reporterId: user._id }, { targetId: user._id }] }),
      User.findByIdAndDelete(user._id),
    ]);

    return res.status(200).json({ message: 'User and associated data deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PATCH /api/admin/users/:id/verify — Toggle verified status
router.patch('/users/:id/verify', requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isVerified = !user.isVerified;
    await user.save();

    return res.status(200).json({
      message: `User ${user.isVerified ? 'verified' : 'unverified'} successfully`,
      isVerified: user.isVerified,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/admin/reports — Get all reports (admin view)
router.get('/reports', requireAdmin, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const status = req.query.status || '';

    const query = {};
    if (status && ['pending', 'reviewed', 'dismissed', 'action_taken'].includes(status)) {
      query.status = status;
    }

    const [reports, total] = await Promise.all([
      Report.find(query)
        .populate('reporterId', 'username name profileImage email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Report.countDocuments(query),
    ]);

    // Populate target info
    const populated = await Promise.all(
      reports.map(async (report) => {
        if (report.targetModel === 'Post') {
          const post = await Post.findById(report.targetId)
            .select('caption mediaUrl userId')
            .populate('userId', 'username name')
            .lean();
          report.target = post;
        } else if (report.targetModel === 'User') {
          const targetUser = await User.findById(report.targetId)
            .select('username name email profileImage')
            .lean();
          report.target = targetUser;
        }
        return report;
      })
    );

    return res.status(200).json({
      reports: populated,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;