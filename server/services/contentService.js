import { dbGet, dbAll, dbRun } from '../db/database.js';

// Create user/creator generated content
export const createContent = async (ownerUid, data) => {
  const owner = await dbGet('SELECT * FROM users WHERE firebase_uid = ? OR id = ?', [ownerUid, ownerUid]);
  if (!owner) throw new Error('Owner user profile not found.');

  const contentId = `c_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
  const contentType = data.contentType || 'nommly';
  const ownerType = owner.is_creator ? 'creator' : 'user';
  const ownerName = owner.display_name;
  const ownerAvatar = owner.avatar_url;

  await dbRun(`
    INSERT INTO content (
      id, content_type, owner_id, owner_type, owner_name, owner_avatar,
      dish_id, dish_title, dish_price, restaurant_name, media_url, poster_url, caption
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    contentId, contentType, owner.id, ownerType, ownerName, ownerAvatar,
    data.dishId || null, data.dishTitle || 'ScrollNom Dish', data.dishPrice || 0,
    data.restaurantName || 'ScrollNom Partner', data.mediaUrl, data.posterUrl || data.mediaUrl,
    data.caption || ''
  ]);

  return await dbGet('SELECT * FROM content WHERE id = ?', [contentId]);
};

// Like Content
export const likeContent = async (userUid, contentId) => {
  const user = await dbGet('SELECT id FROM users WHERE firebase_uid = ?', [userUid]);
  if (!user) throw new Error('User not found');

  const content = await dbGet('SELECT id FROM content WHERE id = ?', [contentId]);
  if (!content) {
    const err = new Error('Content not found');
    err.statusCode = 404;
    throw err;
  }

  const likeId = `l_${user.id}_${contentId}`;
  await dbRun('INSERT OR IGNORE INTO content_likes (id, user_id, content_id) VALUES (?, ?, ?)', [likeId, user.id, contentId]);

  const countRow = await dbGet('SELECT COUNT(*) as count FROM content_likes WHERE content_id = ?', [contentId]);
  const newLikeCount = countRow ? countRow.count : 0;

  await dbRun('UPDATE content SET like_count = ? WHERE id = ?', [newLikeCount, contentId]);

  return { success: true, isLiked: true, contentId, likeCount: newLikeCount };
};

// Unlike Content
export const unlikeContent = async (userUid, contentId) => {
  const user = await dbGet('SELECT id FROM users WHERE firebase_uid = ?', [userUid]);
  if (!user) throw new Error('User not found');

  await dbRun('DELETE FROM content_likes WHERE user_id = ? AND content_id = ?', [user.id, contentId]);

  const countRow = await dbGet('SELECT COUNT(*) as count FROM content_likes WHERE content_id = ?', [contentId]);
  const newLikeCount = countRow ? countRow.count : 0;

  await dbRun('UPDATE content SET like_count = ? WHERE id = ?', [newLikeCount, contentId]);

  return { success: true, isLiked: false, contentId, likeCount: newLikeCount };
};

// Save Content / Dish
export const saveContent = async (userUid, contentId) => {
  const user = await dbGet('SELECT id FROM users WHERE firebase_uid = ?', [userUid]);
  if (!user) throw new Error('User not found');

  const content = await dbGet('SELECT id, dish_id FROM content WHERE id = ?', [contentId]);
  if (!content) {
    const err = new Error('Content not found');
    err.statusCode = 404;
    throw err;
  }

  const saveId = `s_${user.id}_${contentId}`;
  await dbRun('INSERT OR IGNORE INTO content_saves (id, user_id, content_id, dish_id) VALUES (?, ?, ?, ?)', [saveId, user.id, contentId, content.dish_id]);

  const countRow = await dbGet('SELECT COUNT(*) as count FROM content_saves WHERE content_id = ?', [contentId]);
  const newSaveCount = countRow ? countRow.count : 0;

  await dbRun('UPDATE content SET save_count = ? WHERE id = ?', [newSaveCount, contentId]);

  return { success: true, isSaved: true, contentId, saveCount: newSaveCount };
};

// Unsave Content / Dish
export const unsaveContent = async (userUid, contentId) => {
  const user = await dbGet('SELECT id FROM users WHERE firebase_uid = ?', [userUid]);
  if (!user) throw new Error('User not found');

  await dbRun('DELETE FROM content_saves WHERE user_id = ? AND content_id = ?', [user.id, contentId]);

  const countRow = await dbGet('SELECT COUNT(*) as count FROM content_saves WHERE content_id = ?', [contentId]);
  const newSaveCount = countRow ? countRow.count : 0;

  await dbRun('UPDATE content SET save_count = ? WHERE id = ?', [newSaveCount, contentId]);

  return { success: true, isSaved: false, contentId, saveCount: newSaveCount };
};

// Get User's Saved Content Items
export const getUserSavedContent = async (userUid) => {
  const user = await dbGet('SELECT id FROM users WHERE firebase_uid = ?', [userUid]);
  if (!user) return [];

  const rows = await dbAll(`
    SELECT c.*, cs.created_at as saved_at
    FROM content_saves cs
    JOIN content c ON cs.content_id = c.id
    WHERE cs.user_id = ?
    ORDER BY cs.created_at DESC
  `, [user.id]);

  return rows.map(r => ({
    id: r.id,
    contentType: r.content_type,
    ownerId: r.owner_id,
    ownerType: r.owner_type,
    ownerName: r.owner_name,
    ownerAvatar: r.owner_avatar,
    dishId: r.dish_id,
    title: r.dish_title,
    dishPrice: r.dish_price,
    restaurantName: r.restaurant_name,
    mediaUrl: r.media_url,
    posterUrl: r.poster_url,
    caption: r.caption,
    likeCount: r.like_count,
    saveCount: r.save_count,
    isSaved: true
  }));
};

// Get Content Created By Specific User / Creator
export const getUserContent = async (userUid) => {
  const user = await dbGet('SELECT id FROM users WHERE firebase_uid = ? OR id = ?', [userUid, userUid]);
  if (!user) return [];

  const rows = await dbAll(`
    SELECT * FROM content
    WHERE owner_id = ?
    ORDER BY created_at DESC
  `, [user.id]);

  return rows.map(r => ({
    id: r.id,
    contentType: r.content_type,
    ownerId: r.owner_id,
    ownerType: r.owner_type,
    ownerName: r.owner_name,
    ownerAvatar: r.owner_avatar,
    dishId: r.dish_id,
    title: r.dish_title,
    dishPrice: r.dish_price,
    restaurantName: r.restaurant_name,
    mediaUrl: r.media_url,
    posterUrl: r.poster_url,
    caption: r.caption,
    likeCount: r.like_count,
    saveCount: r.save_count,
    createdAt: r.created_at
  }));
};
