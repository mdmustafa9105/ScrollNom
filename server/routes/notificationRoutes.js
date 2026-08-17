import express from 'express';
import {
  listNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
  streamRealtime
} from '../controllers/notificationController.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = express.Router();

router.get('/notifications', requireAuth, listNotifications);
router.get('/notifications/unread-count', requireAuth, getUnreadCount);
router.post('/notifications/read-all', requireAuth, markAllRead);
router.post('/notifications/:notificationId/read', requireAuth, markRead);
router.get('/notifications/stream', requireAuth, streamRealtime);

export default router;
