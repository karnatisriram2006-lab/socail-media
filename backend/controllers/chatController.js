const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const Post = require('../models/Post');

const createNotification = async (receiverId, sender, message, type = 'message') => {
  if (!global.io) return;
  global.io.to(`user:${receiverId}`).emit('newNotification', {
    type,
    title: `New message from ${sender.name || sender.username}`,
    body: message,
    sender: {
      _id: sender._id,
      username: sender.username,
      profileImage: sender.profileImage,
    },
    createdAt: new Date(),
  });
};

exports.getConversations = async (req, res) => {
  const userId = req.user.id;

  const conversations = await Conversation.find({ participants: userId })
    .sort({ lastMessageAt: -1 })
    .populate('participants', 'username name profileImage isOnline lastActive')
    .lean();

  return res.status(200).json(conversations);
};

exports.createConversation = async (req, res) => {
  const userId = req.user.id;
  const { participantId } = req.body;

  if (!participantId) {
    return res.status(400).json({ message: 'participantId is required' });
  }
  if (participantId === userId) {
    return res.status(400).json({ message: 'Cannot create conversation with yourself' });
  }

  let conversation = await Conversation.findOne({
    participants: { $all: [userId, participantId] },
    $expr: { $eq: [{ $size: '$participants' }, 2] },
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [userId, participantId],
      unreadCount: { [participantId]: 0, [userId]: 0 },
    });
  }

  await conversation.populate('participants', 'username name profileImage isOnline lastActive');
  return res.status(201).json(conversation);
};

exports.getMessages = async (req, res) => {
  const userId = req.user.id;
  const { conversationId } = req.params;
  const limit = parseInt(req.query.limit, 10) || 50;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);

  const conversation = await Conversation.findById(conversationId);
  if (!conversation || !conversation.participants.includes(userId)) {
    return res.status(403).json({ message: 'Conversation not found or access denied' });
  }

  const messages = await Message.find({ conversationId })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('sender', 'username name profileImage')
    .populate('sharedPost')
    .populate('sharedProfile', 'username name profileImage');

  return res.status(200).json(messages.reverse());
};

exports.sendMessage = async (req, res) => {
  const userId = req.user.id;
  const { conversationId } = req.params;
  const {
    messageType = 'text',
    content = '',
    sharedPostId,
    sharedProfileId,
    imageUrl,
  } = req.body;

  const conversation = await Conversation.findById(conversationId);
  if (!conversation || !conversation.participants.includes(userId)) {
    return res.status(403).json({ message: 'Conversation not found or access denied' });
  }

  const receiverId = conversation.participants.find(
    (participant) => participant.toString() !== userId.toString()
  );
  if (!receiverId) {
    return res.status(400).json({ message: 'Receiver not found' });
  }

  const sender = await User.findById(userId).select('username name profileImage');

  const message = await Message.create({
    conversationId,
    sender: userId,
    receiver: receiverId,
    messageType,
    content,
    imageUrl,
    sharedPost: sharedPostId,
    sharedProfile: sharedProfileId,
  });

  await message.populate('sender', 'username name profileImage');
  await message.populate('sharedPost');
  await message.populate('sharedProfile', 'username name profileImage');

  const lastMessageText =
    messageType === 'text'
      ? content
      : messageType === 'image'
      ? 'Sent a photo'
      : messageType === 'post'
      ? 'Shared a post'
      : messageType === 'profile'
      ? 'Shared a profile'
      : 'Sent a message';

  conversation.lastMessage = lastMessageText;
  conversation.lastMessageType = messageType;
  conversation.lastMessageAt = new Date();
  conversation.unreadCount.set(
    receiverId.toString(),
    (conversation.unreadCount.get(receiverId.toString()) || 0) + 1
  );
  await conversation.save();

  const payload = {
    conversationId: conversation._id,
    message,
    conversation: {
      _id: conversation._id,
      lastMessage: conversation.lastMessage,
      lastMessageType: conversation.lastMessageType,
      lastMessageAt: conversation.lastMessageAt,
      unreadCount: Object.fromEntries(conversation.unreadCount),
    },
  };

  global.io.to(`conversation:${conversationId}`).emit('conversationUpdated', payload.conversation);
  global.io.to(`user:${receiverId}`).emit('message_received', payload);
  createNotification(receiverId, sender, lastMessageText, 'message');

  return res.status(201).json(payload);
};

exports.markSeen = async (req, res) => {
  const userId = req.user.id;
  const { conversationId } = req.params;

  const conversation = await Conversation.findById(conversationId);
  if (!conversation || !conversation.participants.includes(userId)) {
    return res.status(403).json({ message: 'Conversation not found or access denied' });
  }

  const updated = await Message.updateMany(
    {
      conversationId,
      receiver: userId,
      isSeen: false,
    },
    {
      $set: { isSeen: true, seenAt: new Date() },
    }
  );

  conversation.unreadCount.set(userId.toString(), 0);
  await conversation.save();

  global.io.to(`conversation:${conversationId}`).emit('message_seen', {
    conversationId,
    userId,
  });

  return res.status(200).json({ seen: updated.modifiedCount });
};
