import { dbGet, dbAll, dbRun } from '../db/database.js';
import { createNotification } from './notificationService.js';

// Follow a User
export const followUser = async (followerUid, targetUserId) => {
  const follower = await dbGet('SELECT id, username, display_name FROM users WHERE firebase_uid = ? OR id = ?', [followerUid, followerUid]);
  if (!follower) throw new Error('Authenticated user profile not found.');

  if (follower.id === targetUserId) {
    const err = new Error('You cannot follow yourself.');
    err.statusCode = 400;
    err.code = 'INVALID_ACTION';
    throw err;
  }

  const target = await dbGet('SELECT id FROM users WHERE id = ? OR LOWER(username) = ?', [targetUserId, targetUserId.toLowerCase()]);
  if (!target) {
    const err = new Error('Target user not found.');
    err.statusCode = 404;
    err.code = 'USER_NOT_FOUND';
    throw err;
  }

  const followId = `fol_${follower.id}_${target.id}`;
  await dbRun(`
    INSERT OR IGNORE INTO follows (id, follower_user_id, following_user_id)
    VALUES (?, ?, ?)
  `, [followId, follower.id, target.id]);

  // Trigger NEW_FOLLOWER Notification to target user
  try {
    await createNotification({
      recipientUserId: target.id,
      actorUserId: follower.id,
      type: 'NEW_FOLLOWER',
      title: 'New Follower!',
      body: `@${follower.username || 'Someone'} started following you.`,
      entityType: 'user',
      entityId: follower.id
    });
  } catch (e) {
    console.error('[FOLLOWER NOTIFICATION ERROR]', e.message);
  }

  const followerCountRow = await dbGet('SELECT COUNT(*) as count FROM follows WHERE following_user_id = ?', [target.id]);

  return {
    success: true,
    isFollowing: true,
    targetUserId: target.id,
    followerCount: followerCountRow ? followerCountRow.count : 0
  };
};

// Unfollow a User
export const unfollowUser = async (followerUid, targetUserId) => {
  const follower = await dbGet('SELECT id FROM users WHERE firebase_uid = ? OR id = ?', [followerUid, followerUid]);
  if (!follower) throw new Error('Authenticated user profile not found.');

  const target = await dbGet('SELECT id FROM users WHERE id = ? OR LOWER(username) = ?', [targetUserId, targetUserId.toLowerCase()]);
  const targetId = target ? target.id : targetUserId;

  await dbRun(`
    DELETE FROM follows
    WHERE follower_user_id = ? AND following_user_id = ?
  `, [follower.id, targetId]);

  const followerCountRow = await dbGet('SELECT COUNT(*) as count FROM follows WHERE following_user_id = ?', [targetId]);

  return {
    success: true,
    isFollowing: false,
    targetUserId: targetId,
    followerCount: followerCountRow ? followerCountRow.count : 0
  };
};

// Get Followers List (Paginated, EMAIL PRIVACY ENFORCED)
export const getFollowers = async (username, currentUserId = null, page = 1, limit = 20) => {
  const targetUser = await dbGet('SELECT id FROM users WHERE LOWER(username) = ?', [username.toLowerCase()]);
  if (!targetUser) throw new Error(`User @${username} not found.`);

  const offset = (Math.max(1, page) - 1) * limit;

  // SELECT public user fields only (No email column)
  const rows = await dbAll(`
    SELECT u.id, u.username, u.display_name, u.avatar_url, u.bio, u.is_creator, f.created_at as followed_at
    FROM follows f
    JOIN users u ON f.follower_user_id = u.id
    WHERE f.following_user_id = ?
    ORDER BY f.created_at DESC
    LIMIT ? OFFSET ?
  `, [targetUser.id, limit, offset]);

  const totalRow = await dbGet('SELECT COUNT(*) as count FROM follows WHERE following_user_id = ?', [targetUser.id]);
  const total = totalRow ? totalRow.count : 0;

  const items = await Promise.all(rows.map(async (u) => {
    let isFollowing = false;
    if (currentUserId && currentUserId !== u.id) {
      const isFol = await dbGet('SELECT id FROM follows WHERE follower_user_id = ? AND following_user_id = ?', [currentUserId, u.id]);
      isFollowing = !!isFol;
    }
    return {
      id: u.id,
      username: u.username,
      displayName: u.display_name,
      avatarUrl: u.avatar_url,
      bio: u.bio,
      isCreator: Boolean(u.is_creator),
      isFollowing
    };
  }));

  return {
    items,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  };
};

// Get Following List (Paginated, EMAIL PRIVACY ENFORCED)
export const getFollowing = async (username, currentUserId = null, page = 1, limit = 20) => {
  const targetUser = await dbGet('SELECT id FROM users WHERE LOWER(username) = ?', [username.toLowerCase()]);
  if (!targetUser) throw new Error(`User @${username} not found.`);

  const offset = (Math.max(1, page) - 1) * limit;

  // SELECT public user fields only (No email column)
  const rows = await dbAll(`
    SELECT u.id, u.username, u.display_name, u.avatar_url, u.bio, u.is_creator, f.created_at as followed_at
    FROM follows f
    JOIN users u ON f.following_user_id = u.id
    WHERE f.follower_user_id = ?
    ORDER BY f.created_at DESC
    LIMIT ? OFFSET ?
  `, [targetUser.id, limit, offset]);

  const totalRow = await dbGet('SELECT COUNT(*) as count FROM follows WHERE follower_user_id = ?', [targetUser.id]);
  const total = totalRow ? totalRow.count : 0;

  const items = await Promise.all(rows.map(async (u) => {
    let isFollowing = false;
    if (currentUserId && currentUserId !== u.id) {
      const isFol = await dbGet('SELECT id FROM follows WHERE follower_user_id = ? AND following_user_id = ?', [currentUserId, u.id]);
      isFollowing = !!isFol;
    }
    return {
      id: u.id,
      username: u.username,
      displayName: u.display_name,
      avatarUrl: u.avatar_url,
      bio: u.bio,
      isCreator: Boolean(u.is_creator),
      isFollowing
    };
  }));

  return {
    items,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  };
};
