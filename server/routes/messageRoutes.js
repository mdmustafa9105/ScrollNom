import express from 'express';
import {
  listConversations,
  getMessages,
  sendDirectMessage,
  createOrGetConv,
  markRead,
  getUnreadCount
} from '../controllers/messageController.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = express.Router();

router.get('/messages/conversations', requireAuth, listConversations);
router.post('/messages/conversations', requireAuth, createOrGetConv);
router.get('/messages/conversations/:conversationId', requireAuth, getMessages);
router.post('/messages/send', requireAuth, sendDirectMessage);
router.post('/messages/read/:conversationId', requireAuth, markRead);
router.get('/messages/unread-count', requireAuth, getUnreadCount);

export default router;
