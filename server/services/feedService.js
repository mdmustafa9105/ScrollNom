import { dbGet, dbAll } from '../db/database.js';

// Get Personalized Following Content Feed
export const getFollowingFeed = async (userUid, page = 1, limit = 10) => {
  const user = await dbGet('SELECT id FROM users WHERE firebase_uid = ? OR id = ?', [userUid, userUid]);
  const currentUserId = user ? user.id : userUid;
  const offset = (Math.max(1, page) - 1) * limit;

  // 1. Fetch content from followed accounts & self
  let feedRows = await dbAll(`
    SELECT c.*, u.username as owner_username
    FROM content c
    LEFT JOIN users u ON c.owner_id = u.id
    WHERE c.owner_id IN (
      SELECT following_user_id FROM follows WHERE follower_user_id = ?
    ) OR c.owner_id = ?
    ORDER BY c.created_at DESC
    LIMIT ? OFFSET ?
  `, [currentUserId, currentUserId, limit, offset]);

  let isSparse = false;

  // 2. If feed is sparse, fill with popular demo fallback content
  if (feedRows.length < limit) {
    isSparse = true;
    const existingIds = new Set(feedRows.map(r => r.id));
    const fallbackRows = await dbAll(`
      SELECT c.*, u.username as owner_username
      FROM content c
      LEFT JOIN users u ON c.owner_id = u.id
      ORDER BY c.like_count DESC, c.created_at DESC
      LIMIT ?
    `, [limit * 2]);

    for (const row of fallbackRows) {
      if (!existingIds.has(row.id) && feedRows.length < limit) {
        feedRows.push(row);
        existingIds.add(row.id);
      }
    }
  }

  // 3. Compute isLiked and isSaved status for each item
  const items = await Promise.all(feedRows.map(async (r) => {
    let isLiked = false;
    let isSaved = false;

    if (currentUserId) {
      const likeRow = await dbGet('SELECT id FROM content_likes WHERE user_id = ? AND content_id = ?', [currentUserId, r.id]);
      isLiked = !!likeRow;

      const saveRow = await dbGet('SELECT id FROM content_saves WHERE user_id = ? AND content_id = ?', [currentUserId, r.id]);
      isSaved = !!saveRow;
    }

    return {
      id: r.id,
      contentType: r.content_type,
      ownerId: r.owner_id,
      ownerType: r.owner_type,
      ownerName: r.owner_name,
      ownerUsername: r.owner_username || r.owner_name.toLowerCase().replace(/\s+/g, ''),
      ownerAvatar: r.owner_avatar,
      dishId: r.dish_id,
      dishTitle: r.dish_title,
      title: r.dish_title,
      dishPrice: r.dish_price,
      restaurantName: r.restaurant_name,
      mediaUrl: r.media_url,
      posterUrl: r.poster_url,
      caption: r.caption,
      likeCount: r.like_count,
      saveCount: r.save_count,
      isLiked,
      isSaved
    };
  }));

  const totalRow = await dbGet('SELECT COUNT(*) as count FROM content');

  return {
    items,
    page,
    limit,
    total: totalRow ? totalRow.count : items.length,
    isSparse
  };
};

// Get Suggested Creators & Accounts to Follow
export const getSuggestedCreators = async (userUid = null) => {
  const user = userUid ? await dbGet('SELECT id FROM users WHERE firebase_uid = ?', [userUid]) : null;
  const currentUserId = user ? user.id : 'u1';

  // Find creators/users not followed by current user
  const creators = await dbAll(`
    SELECT id, username, display_name, avatar_url, bio, is_creator
    FROM users
    WHERE id != ? AND id NOT IN (
      SELECT following_user_id FROM follows WHERE follower_user_id = ?
    )
    ORDER BY is_creator DESC, created_at DESC
    LIMIT 6
  `, [currentUserId, currentUserId]);

  const results = await Promise.all(creators.map(async (c) => {
    const followerRow = await dbGet('SELECT COUNT(*) as count FROM follows WHERE following_user_id = ?', [c.id]);
    return {
      id: c.id,
      username: c.username,
      displayName: c.display_name,
      avatarUrl: c.avatar_url,
      bio: c.bio,
      isCreator: Boolean(c.is_creator),
      followerCount: followerRow ? followerRow.count : 0,
      isFollowing: false
    };
  }));

  return results;
};
