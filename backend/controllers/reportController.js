const Report = require('../models/Report');
const Post = require('../models/Post');
const User = require('../models/User');

// Map target types to their respective models and field names
const TARGET_MAP = {
  post: { model: 'Post', field: 'post' },
  user: { model: 'User', field: 'user' },
  comment: { model: 'Comment', field: 'comment' },
};

// POST /api/reports — Create a report
exports.createReport = async (req, res) => {
  try {
    const { targetType, targetId, reason, description } = req.body;

    if (!targetType || !targetId || !reason) {
      return res.status(400).json({ message: 'targetType, targetId, and reason are required' });
    }

    const targetInfo = TARGET_MAP[targetType];
    if (!targetInfo) {
      return res.status(400).json({ message: 'Invalid targetType. Must be post, user, or comment' });
    }

    // Verify the target exists
    const Model = targetType === 'post' ? Post : targetType === 'user' ? User : require('../models/Comment');
    const target = await Model.findById(targetId);
    if (!target) {
      return res.status(404).json({ message: `${targetType} not found` });
    }

    // Don't allow reporting yourself
    if (targetType === 'user' && target._id.toString() === req.user.id.toString()) {
      return res.status(400).json({ message: 'You cannot report yourself' });
    }

    // Check for duplicate pending report from same reporter
    const existingReport = await Report.findOne({
      reporterId: req.user.id,
      targetType,
      targetId,
      status: 'pending',
    });
    if (existingReport) {
      return res.status(400).json({ message: 'You have already reported this content. Our team will review it shortly.' });
    }

    const report = await Report.create({
      reporterId: req.user.id,
      targetType,
      targetId,
      targetModel: targetInfo.model,
      reason,
      description: description || '',
    });

    return res.status(201).json({
      message: 'Report submitted successfully. Our moderation team will review it.',
      report,
    });
  } catch (error) {
    console.error('createReport error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/reports — List reports (admin only)
exports.getReports = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status && ['pending', 'reviewed', 'dismissed', 'action_taken'].includes(status)) {
      query.status = status;
    }

    const reports = await Report.find(query)
      .populate('reporterId', 'username name profileImage')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    // Populate target fields dynamically
    const populated = await Promise.all(
      reports.map(async (report) => {
        try {
          const Model = report.targetModel === 'Post'
            ? Post
            : report.targetModel === 'User'
            ? User
            : require('../models/Comment');
          const target = await Model.findById(report.targetId)
            .select(report.targetModel === 'Post' ? 'caption mediaUrl mediaType' : 'username name profileImage')
            .lean();
          report.target = target || null;
        } catch {
          report.target = null;
        }
        return report;
      })
    );

    const total = await Report.countDocuments(query);

    return res.status(200).json({
      reports: populated,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('getReports error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PATCH /api/reports/:id — Review a report (admin only)
exports.reviewReport = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const validStatuses = ['reviewed', 'dismissed', 'action_taken'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    report.status = status;
    report.reviewedBy = req.user.id;
    report.reviewedAt = new Date();
    if (adminNotes !== undefined) report.adminNotes = adminNotes;
    await report.save();

    return res.status(200).json({ message: 'Report updated successfully', report });
  } catch (error) {
    console.error('reviewReport error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/reports/stats — Report statistics (admin only)
exports.getReportStats = async (req, res) => {
  try {
    const [pending, total, byReason] = await Promise.all([
      Report.countDocuments({ status: 'pending' }),
      Report.countDocuments(),
      Report.aggregate([
        { $group: { _id: '$reason', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    return res.status(200).json({
      pending,
      reviewed: await Report.countDocuments({ status: 'reviewed' }),
      dismissed: await Report.countDocuments({ status: 'dismissed' }),
      actionTaken: await Report.countDocuments({ status: 'action_taken' }),
      total,
      byReason: byReason.map((r) => ({ reason: r._id, count: r.count })),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};