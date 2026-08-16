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

  const taggedDishes = data.taggedDishes || (data.dishId ? [{ dishId: data.dishId, name: data.dishTitle, price: data.dishPrice }] : []);
  const firstDish = taggedDishes[0] || {};
  const categories = data.categories || (firstDish.category ? [firstDish.category] : ['MAIN_FOOD']);
  const timeBelts = data.timeBelts || ['AFTERNOON'];

  await dbRun(`
    INSERT INTO content (
      id, content_type, owner_id, owner_type, owner_name, owner_avatar,
      restaurant_id, dish_id, dish_title, dish_price, restaurant_name, media_url, poster_url, caption,
      tagged_dishes_json, food_categories_json, time_belts_json, analysis_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')
  `, [
    contentId, contentType, owner.id, ownerType, ownerName, ownerAvatar,
    data.restaurantId || 'r1', firstDish.dishId || data.dishId || null, firstDish.name || data.dishTitle || 'ScrollNom Dish', firstDish.price || data.dishPrice || 0,
    data.restaurantName || 'ScrollNom Partner', data.mediaUrl, data.posterUrl || data.mediaUrl,
    data.caption || '', JSON.stringify(taggedDishes), JSON.stringify(categories), JSON.stringify(timeBelts)
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

const formatContentItem = async (r, currentUserId = null) => {
  let isLiked = false;
  let isSaved = false;

  if (currentUserId) {
    const likeRow = await dbGet('SELECT id FROM content_likes WHERE user_id = ? AND content_id = ?', [currentUserId, r.id]);
    isLiked = !!likeRow;

    const saveRow = await dbGet('SELECT id FROM content_saves WHERE user_id = ? AND content_id = ?', [currentUserId, r.id]);
    isSaved = !!saveRow;
  }

  let taggedDishes = [];
  let foodCategories = [];
  let timeBelts = [];
  try { taggedDishes = JSON.parse(r.tagged_dishes_json || '[]'); } catch (e) {}
  try { foodCategories = JSON.parse(r.food_categories_json || '[]'); } catch (e) {}
  try { timeBelts = JSON.parse(r.time_belts_json || '[]'); } catch (e) {}

  if (taggedDishes.length === 0 && r.dish_id) {
    taggedDishes = [{ dishId: r.dish_id, name: r.dish_title, price: r.dish_price }];
  }

  const ownerUser = await dbGet('SELECT username, display_name, avatar_url, is_creator FROM users WHERE id = ?', [r.owner_id]);
  const ownerUsername = ownerUser?.username || (r.owner_name ? r.owner_name.toLowerCase().replace(/\s+/g, '') : 'creator');

  return {
    id: r.id,
    contentType: r.content_type,
    ownerId: r.owner_id,
    ownerType: r.owner_type,
    ownerName: ownerUser?.display_name || r.owner_name,
    ownerUsername: ownerUsername,
    creatorName: ownerUser?.display_name || r.owner_name,
    creatorHandle: `@${ownerUsername}`,
    creatorAvatar: ownerUser?.avatar_url || r.owner_avatar,
    isVerifiedCreator: Boolean(ownerUser?.is_creator || r.owner_type === 'creator'),
    restaurantId: r.restaurant_id || 'r1',
    restaurantName: r.restaurant_name,
    restaurantDistance: '2.0 km',
    dishId: r.dish_id,
    dishTitle: r.dish_title || r.caption,
    title: r.caption || r.dish_title || 'Nommly Reel',
    dishPrice: r.dish_price,
    videoUrl: r.media_url,
    mediaUrl: r.media_url,
    posterUrl: r.poster_url || 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
    caption: r.caption,
    taggedDishes,
    foodCategories,
    categories: foodCategories,
    timeBelts,
    analysisStatus: r.analysis_status || 'confirmed',
    likeCount: r.like_count,
    likesCount: `${r.like_count || 0}`,
    saveCount: r.save_count,
    commentsCount: '12',
    sharesCount: '5',
    isLiked,
    isSaved,
    rating: 4.8,
    createdAt: r.created_at
  };
};

export const getPublicNommlyContent = async (userUid = null) => {
  let currentUserId = null;
  if (userUid) {
    const user = await dbGet('SELECT id FROM users WHERE firebase_uid = ? OR id = ?', [userUid, userUid]);
    currentUserId = user ? user.id : userUid;
  }

  const rows = await dbAll(`
    SELECT c.*, u.username as owner_username
    FROM content c
    LEFT JOIN users u ON c.owner_id = u.id
    WHERE c.content_type = 'nommly'
    ORDER BY c.created_at DESC
  `);

  return await Promise.all(rows.map(r => formatContentItem(r, currentUserId)));
};

export const getCreatorContentByUsername = async (targetUsername, userUid = null) => {
  let currentUserId = null;
  if (userUid) {
    const user = await dbGet('SELECT id FROM users WHERE firebase_uid = ? OR id = ?', [userUid, userUid]);
    currentUserId = user ? user.id : userUid;
  }

  const cleanUsername = targetUsername.trim().toLowerCase();
  const creatorUser = await dbGet('SELECT id FROM users WHERE LOWER(username) = ?', [cleanUsername]);
  if (!creatorUser) return [];

  const rows = await dbAll(`
    SELECT c.*, u.username as owner_username
    FROM content c
    LEFT JOIN users u ON c.owner_id = u.id
    WHERE c.owner_id = ? AND c.content_type = 'nommly'
    ORDER BY c.created_at DESC
  `, [creatorUser.id]);

  return await Promise.all(rows.map(r => formatContentItem(r, currentUserId)));
};

