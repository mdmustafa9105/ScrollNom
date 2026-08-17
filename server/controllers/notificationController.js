import {
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead
} from '../services/notificationService.js';
import { realtimeService } from '../services/realtimeService.js';

export const listNotifications = async (req, res, next) => {
  try {
    const currentUserId = req.user.uid;
    const limit = parseInt(req.query.limit || '50', 10);
    const offset = parseInt(req.query.offset || '0', 10);
    const notifications = await getUserNotifications(currentUserId, limit, offset);
    res.json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
};

export const getUnreadCount = async (req, res, next) => {
  try {
    const currentUserId = req.user.uid;
    const count = await getUnreadNotificationCount(currentUserId);
    res.json({ success: true, data: { unreadCount: count } });
  } catch (error) {
    next(error);
  }
};

export const markRead = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    const currentUserId = req.user.uid;
    const result = await markNotificationRead(notificationId, currentUserId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const markAllRead = async (req, res, next) => {
  try {
    const currentUserId = req.user.uid;
    const result = await markAllNotificationsRead(currentUserId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const streamRealtime = (req, res) => {
  const currentUserId = req.user.uid;

  // Set SSE Headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  // Send initial connection ACK
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', userId: currentUserId, timestamp: new Date().toISOString() })}\n\n`);

  // Subscribe client to real-time user channel
  realtimeService.subscribeUser(currentUserId, res);
};
