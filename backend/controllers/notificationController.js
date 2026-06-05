const Notification = require('../models/Notification');

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ receiverId: req.user.id })
      .populate('senderId', 'username name profileImage isVerified')
      .populate('postId', 'image caption')
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json(notifications);
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { receiverId: req.user.id, isRead: false },
      { $set: { isRead: true } }
    );

    if (global.io) {
      const targetSocketId = global.onlineUsers.get(req.user.id);
      if (targetSocketId) {
        global.io.to(targetSocketId).emit('notificationsRead');
      }
    }

    return res.status(200).json({ message: 'Notifications marked as read' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
