import { dbGet, dbAll, dbRun } from '../db/database.js';
import { realtimeService } from './realtimeService.js';
import { createNotification } from './notificationService.js';

// Resolve user by id, firebase_uid, or username
async function resolveUser(identifier) {
  if (!identifier) return null;
  const user = await dbGet(`
    SELECT id, firebase_uid, username, display_name, avatar_url
    FROM users
    WHERE id = ? OR firebase_uid = ? OR LOWER(username) = ?
  `, [identifier, identifier, identifier.toLowerCase()]);
  return user;
}

// Get or Create Conversation between User A and User B
export const getOrCreateConversation = async (userAId, userBId) => {
  const userA = await resolveUser(userAId);
  const userB = await resolveUser(userBId);

  if (!userA || !userB) {
    const err = new Error('One or both users not found.');
    err.statusCode = 404;
    throw err;
  }

  if (userA.id === userB.id) {
    const err = new Error('Cannot start a conversation with yourself.');
    err.statusCode = 400;
    throw err;
  }

  // Canonical ordering of participants to ensure UNIQUE(participant_a, participant_b)
  const [partA, partB] = [userA.id, userB.id].sort();

  let conversation = await dbGet(`
    SELECT id, participant_a, participant_b, created_at, updated_at
    FROM conversations
    WHERE participant_a = ? AND participant_b = ?
  `, [partA, partB]);

  if (!conversation) {
    const convId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`;
    await dbRun(`
      INSERT INTO conversations (id, participant_a, participant_b, created_at, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [convId, partA, partB]);

    conversation = await dbGet(`
      SELECT id, participant_a, participant_b, created_at, updated_at
      FROM conversations
      WHERE id = ?
    `, [convId]);
  }

  return conversation;
};

// Send Message
export const sendMessage = async (senderId, recipientId, body) => {
  if (!body || !body.trim()) {
    const err = new Error('Message body cannot be empty.');
    err.statusCode = 400;
    throw err;
  }

  const sender = await resolveUser(senderId);
  const recipient = await resolveUser(recipientId);

  if (!sender || !recipient) {
    const err = new Error('Sender or recipient user profile not found.');
    err.statusCode = 404;
    throw err;
  }

  const conversation = await getOrCreateConversation(sender.id, recipient.id);
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`;

  await dbRun(`
    INSERT INTO messages (id, conversation_id, sender_id, body, created_at, read_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, NULL)
  `, [messageId, conversation.id, sender.id, body.trim()]);

  // Update conversation updated_at timestamp
  await dbRun(`
    UPDATE conversations
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [conversation.id]);

  const createdMsg = await dbGet(`
    SELECT m.id, m.conversation_id, m.sender_id, m.body, m.created_at, m.read_at,
           u.username as sender_username, u.display_name as sender_display_name, u.avatar_url as sender_avatar_url
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    WHERE m.id = ?
  `, [messageId]);

  const msgPayload = {
    id: createdMsg.id,
    conversationId: createdMsg.conversation_id,
    senderId: createdMsg.sender_id,
    senderUsername: createdMsg.sender_username,
    senderDisplayName: createdMsg.sender_display_name,
    senderAvatarUrl: createdMsg.sender_avatar_url,
    body: createdMsg.body,
    createdAt: createdMsg.created_at,
    readAt: createdMsg.read_at
  };

  // 1. Push real-time SSE message event to recipient
  realtimeService.sendToUser(recipient.id, 'MESSAGE_RECEIVED', msgPayload);

  // 2. Trigger MESSAGE_RECEIVED Notification to recipient
  await createNotification({
    recipientUserId: recipient.id,
    actorUserId: sender.id,
    type: 'MESSAGE_RECEIVED',
    title: `New message from @${sender.username}`,
    body: createdMsg.body.length > 50 ? `${createdMsg.body.slice(0, 50)}...` : createdMsg.body,
    entityType: 'conversation',
    entityId: conversation.id
  });

  return msgPayload;
};

// Get User Conversations List (Sorted by recent activity, with unread count)
export const getUserConversations = async (userIdentifier) => {
  const user = await resolveUser(userIdentifier);
  if (!user) throw new Error('User not found.');

  const conversations = await dbAll(`
    SELECT c.id, c.participant_a, c.participant_b, c.created_at, c.updated_at
    FROM conversations c
    WHERE c.participant_a = ? OR c.participant_b = ?
    ORDER BY c.updated_at DESC
  `, [user.id, user.id]);

  const results = await Promise.all(conversations.map(async (conv) => {
    const otherUserId = conv.participant_a === user.id ? conv.participant_b : conv.participant_a;
    const otherUser = await dbGet(`
      SELECT id, username, display_name, avatar_url, is_creator
      FROM users WHERE id = ?
    `, [otherUserId]);

    const lastMsg = await dbGet(`
      SELECT id, sender_id, body, created_at, read_at
      FROM messages
      WHERE conversation_id = ?
      ORDER BY created_at DESC LIMIT 1
    `, [conv.id]);

    const unreadRow = await dbGet(`
      SELECT COUNT(*) as count
      FROM messages
      WHERE conversation_id = ? AND sender_id != ? AND read_at IS NULL
    `, [conv.id, user.id]);

    return {
      id: conv.id,
      otherUser: otherUser ? {
        id: otherUser.id,
        username: otherUser.username,
        displayName: otherUser.display_name,
        avatarUrl: otherUser.avatar_url,
        isCreator: Boolean(otherUser.is_creator)
      } : null,
      lastMessage: lastMsg ? {
        id: lastMsg.id,
        senderId: lastMsg.sender_id,
        body: lastMsg.body,
        createdAt: lastMsg.created_at,
        isRead: !!lastMsg.read_at
      } : null,
      unreadCount: unreadRow ? unreadRow.count : 0,
      createdAt: conv.created_at,
      updatedAt: conv.updated_at
    };
  }));

  return results;
};

// Get Messages in a Conversation (Enforcing user participation security)
export const getConversationMessages = async (conversationId, userIdentifier) => {
  const user = await resolveUser(userIdentifier);
  if (!user) throw new Error('User not found.');

  const conversation = await dbGet(`
    SELECT id, participant_a, participant_b
    FROM conversations
    WHERE id = ?
  `, [conversationId]);

  if (!conversation) {
    const err = new Error('Conversation not found.');
    err.statusCode = 404;
    throw err;
  }

  // Security Check: User must be a participant
  if (conversation.participant_a !== user.id && conversation.participant_b !== user.id) {
    const err = new Error('Access denied. You are not a participant in this conversation.');
    err.statusCode = 403;
    throw err;
  }

  // Mark all unread messages received by this user as read
  await dbRun(`
    UPDATE messages
    SET read_at = CURRENT_TIMESTAMP
    WHERE conversation_id = ? AND sender_id != ? AND read_at IS NULL
  `, [conversationId, user.id]);

  // Mark corresponding MESSAGE_RECEIVED notification as read
  await dbRun(`
    UPDATE notifications
    SET is_read = 1
    WHERE recipient_user_id = ? AND entity_type = 'conversation' AND entity_id = ?
  `, [user.id, conversationId]);

  const messages = await dbAll(`
    SELECT m.id, m.conversation_id, m.sender_id, m.body, m.created_at, m.read_at,
           u.username as sender_username, u.display_name as sender_display_name, u.avatar_url as sender_avatar_url
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    WHERE m.conversation_id = ?
    ORDER BY m.created_at ASC
  `, [conversationId]);

  return messages.map(m => ({
    id: m.id,
    conversationId: m.conversation_id,
    senderId: m.sender_id,
    senderUsername: m.sender_username,
    senderDisplayName: m.sender_display_name,
    senderAvatarUrl: m.sender_avatar_url,
    body: m.body,
    createdAt: m.created_at,
    readAt: m.read_at
  }));
};

// Mark Conversation as Read
export const markConversationAsRead = async (conversationId, userIdentifier) => {
  const user = await resolveUser(userIdentifier);
  if (!user) throw new Error('User not found.');

  await dbRun(`
    UPDATE messages
    SET read_at = CURRENT_TIMESTAMP
    WHERE conversation_id = ? AND sender_id != ? AND read_at IS NULL
  `, [conversationId, user.id]);

  await dbRun(`
    UPDATE notifications
    SET is_read = 1
    WHERE recipient_user_id = ? AND entity_type = 'conversation' AND entity_id = ?
  `, [user.id, conversationId]);

  return { success: true, conversationId };
};

// Get Total Unread Message Count across all conversations for user
export const getUnreadMessageCount = async (userIdentifier) => {
  const user = await resolveUser(userIdentifier);
  if (!user) return 0;

  const row = await dbGet(`
    SELECT COUNT(*) as count
    FROM messages m
    JOIN conversations c ON m.conversation_id = c.id
    WHERE (c.participant_a = ? OR c.participant_b = ?)
      AND m.sender_id != ?
      AND m.read_at IS NULL
  `, [user.id, user.id, user.id]);

  return row ? row.count : 0;
};
