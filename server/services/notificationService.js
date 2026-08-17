import { dbGet, dbAll, dbRun } from '../db/database.js';
import { realtimeService } from './realtimeService.js';

// Create a Notification & push SSE event to recipient
export const createNotification = async ({
  recipientUserId,
  actorUserId = null,
  type,
  title,
  body,
  entityType = null,
  entityId = null
}) => {
  if (!recipientUserId || !type || !title || !body) {
    throw new Error('Missing required notification fields.');
  }

  // Deduplication check for state transitions (e.g. repeated order polling)
  if (entityType && entityId) {
    const existing = await dbGet(`
      SELECT id FROM notifications
      WHERE recipient_user_id = ? AND type = ? AND entity_type = ? AND entity_id = ?
    `, [recipientUserId, type, entityType, entityId]);

    if (existing) {
      console.log(`[NOTIFICATION DEDUP] Skipped duplicate notification: ${type} for entity ${entityId}`);
      return existing;
    }
  }

  const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`;

  await dbRun(`
    INSERT INTO notifications (
      id, recipient_user_id, actor_user_id, type, title, body, entity_type, entity_id, is_read, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
  `, [notificationId, recipientUserId, actorUserId, type, title, body, entityType, entityId]);

  // Fetch created notification with actor user details
  const createdNotif = await dbGet(`
    SELECT n.id, n.recipient_user_id, n.actor_user_id, n.type, n.title, n.body,
           n.entity_type, n.entity_id, n.is_read, n.created_at,
           u.username as actor_username, u.display_name as actor_display_name, u.avatar_url as actor_avatar_url
    FROM notifications n
    LEFT JOIN users u ON n.actor_user_id = u.id
    WHERE n.id = ?
  `, [notificationId]);

  const payload = {
    id: createdNotif.id,
    recipientUserId: createdNotif.recipient_user_id,
    actorUserId: createdNotif.actor_user_id,
    actorUsername: createdNotif.actor_username,
    actorDisplayName: createdNotif.actor_display_name,
    actorAvatarUrl: createdNotif.actor_avatar_url,
    type: createdNotif.type,
    title: createdNotif.title,
    body: createdNotif.body,
    entityType: createdNotif.entity_type,
    entityId: createdNotif.entity_id,
    isRead: false,
    createdAt: createdNotif.created_at
  };

  // Dispatch real-time SSE event to recipient
  realtimeService.sendToUser(recipientUserId, 'NOTIFICATION', payload);

  return payload;
};

// Get User Notifications (Paginated)
export const getUserNotifications = async (userId, limit = 50, offset = 0) => {
  const rows = await dbAll(`
    SELECT n.id, n.recipient_user_id, n.actor_user_id, n.type, n.title, n.body,
           n.entity_type, n.entity_id, n.is_read, n.created_at,
           u.username as actor_username, u.display_name as actor_display_name, u.avatar_url as actor_avatar_url
    FROM notifications n
    LEFT JOIN users u ON n.actor_user_id = u.id
    WHERE n.recipient_user_id = ?
    ORDER BY n.created_at DESC
    LIMIT ? OFFSET ?
  `, [userId, limit, offset]);

  return rows.map(r => ({
    id: r.id,
    recipientUserId: r.recipient_user_id,
    actorUserId: r.actor_user_id,
    actorUsername: r.actor_username,
    actorDisplayName: r.actor_display_name,
    actorAvatarUrl: r.actor_avatar_url,
    type: r.type,
    title: r.title,
    body: r.body,
    entityType: r.entity_type,
    entityId: r.entity_id,
    isRead: Boolean(r.is_read),
    createdAt: r.created_at
  }));
};

// Get Unread Notification Count
export const getUnreadNotificationCount = async (userId) => {
  const row = await dbGet(`
    SELECT COUNT(*) as count FROM notifications
    WHERE recipient_user_id = ? AND is_read = 0
  `, [userId]);
  return row ? row.count : 0;
};

// Mark Single Notification as Read
export const markNotificationRead = async (notificationId, userId) => {
  await dbRun(`
    UPDATE notifications
    SET is_read = 1
    WHERE id = ? AND recipient_user_id = ?
  `, [notificationId, userId]);

  const unreadCount = await getUnreadNotificationCount(userId);
  return { success: true, notificationId, unreadCount };
};

// Mark All Notifications as Read
export const markAllNotificationsRead = async (userId) => {
  await dbRun(`
    UPDATE notifications
    SET is_read = 1
    WHERE recipient_user_id = ? AND is_read = 0
  `, [userId]);

  return { success: true, unreadCount: 0 };
};
