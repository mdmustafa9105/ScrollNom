import {
  getUserConversations,
  getConversationMessages,
  sendMessage,
  markConversationAsRead,
  getUnreadMessageCount,
  getOrCreateConversation
} from '../services/messageService.js';

export const listConversations = async (req, res, next) => {
  try {
    const currentUserId = req.user.uid;
    const conversations = await getUserConversations(currentUserId);
    res.json({ success: true, data: conversations });
  } catch (error) {
    next(error);
  }
};

export const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const currentUserId = req.user.uid;
    const messages = await getConversationMessages(conversationId, currentUserId);
    res.json({ success: true, data: messages });
  } catch (error) {
    next(error);
  }
};

export const sendDirectMessage = async (req, res, next) => {
  try {
    const currentUserId = req.user.uid;
    const { recipientId, body } = req.body;

    if (!recipientId || !body) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'recipientId and body are required.' }
      });
    }

    const message = await sendMessage(currentUserId, recipientId, body);
    res.json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
};

export const createOrGetConv = async (req, res, next) => {
  try {
    const currentUserId = req.user.uid;
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'targetUserId is required.' }
      });
    }

    const conversation = await getOrCreateConversation(currentUserId, targetUserId);
    res.json({ success: true, data: conversation });
  } catch (error) {
    next(error);
  }
};

export const markRead = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const currentUserId = req.user.uid;
    const result = await markConversationAsRead(conversationId, currentUserId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getUnreadCount = async (req, res, next) => {
  try {
    const currentUserId = req.user.uid;
    const count = await getUnreadMessageCount(currentUserId);
    res.json({ success: true, data: { unreadCount: count } });
  } catch (error) {
    next(error);
  }
};
