import { dbGet, dbAll, dbRun } from '../db/database.js';

// Sanitize & validate username format
export const validateUsernameFormat = (username) => {
  if (!username || typeof username !== 'string') return false;
  const clean = username.trim().toLowerCase();
  // 3 to 20 alphanumeric characters or underscores
  const regex = /^[a-z0-9_]{3,20}$/;
  return regex.test(clean);
};

// Check username availability (allows current user to keep their own username)
export const checkUsernameAvailable = async (username, currentUserId = null) => {
  if (!validateUsernameFormat(username)) {
    return { available: false, reason: 'Invalid format. Use 3-20 letters, numbers, or underscores.' };
  }
  const cleanUsername = username.trim().toLowerCase();
  const existing = await dbGet('SELECT id, firebase_uid FROM users WHERE LOWER(username) = ?', [cleanUsername]);
  if (!existing || (currentUserId && (existing.id === currentUserId || existing.firebase_uid === currentUserId))) {
    return { available: true, username: cleanUsername };
  }
  return { available: false, reason: 'Username is already taken' };
};

// Sync Firebase User to persistent database
export const syncFirebaseUser = async (uid, email, displayName) => {
  let user = await dbGet('SELECT * FROM users WHERE firebase_uid = ? OR id = ?', [uid, uid]);
  
  if (!user) {
    // Generate clean default username if new signup
    const baseName = (displayName || email.split('@')[0]).replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    let username = baseName.slice(0, 15) || 'foodie';
    
    const existing = await dbGet('SELECT id FROM users WHERE LOWER(username) = ?', [username]);
    if (existing) {
      username = `${username}_${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const userId = uid; // Use Firebase UID as primary ID
    const cleanDisplayName = displayName || email.split('@')[0];
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;

    await dbRun(`
      INSERT INTO users (id, firebase_uid, email, username, display_name, avatar_url, bio, is_creator)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `, [userId, uid, email, username, cleanDisplayName, avatarUrl, 'Food enthusiast on ScrollNom']);

    user = await dbGet('SELECT * FROM users WHERE id = ?', [userId]);
  }

  return {
    id: user.id,
    firebaseUid: user.firebase_uid,
    username: user.username,
    name: user.display_name,
    displayName: user.display_name,
    avatarUrl: user.avatar_url,
    bio: user.bio,
    isCreator: Boolean(user.is_creator),
    is_creator: user.is_creator,
    createdAt: user.created_at
  };
};

// Search Users (EMAIL PRIVACY ENFORCED: Never selects email column)
export const searchUsers = async (query, currentUserId = null) => {
  const cleanQuery = query ? query.trim().toLowerCase() : '';
  let users = [];

  if (!cleanQuery) {
    // Empty query fallback: return top creators & community members
    users = await dbAll(`
      SELECT id, username, display_name, avatar_url, bio, is_creator, created_at
      FROM users
      ORDER BY is_creator DESC, created_at DESC
      LIMIT 15
    `);
  } else {
    const exactTerm = cleanQuery;
    const prefixTerm = `${cleanQuery}%`;
    const partialTerm = `%${cleanQuery}%`;

    // Explicitly SELECT only public fields with deterministic relevance ranking
    users = await dbAll(`
      SELECT id, username, display_name, avatar_url, bio, is_creator, created_at,
        CASE
          WHEN LOWER(username) = ? THEN 1
          WHEN LOWER(username) LIKE ? THEN 2
          WHEN LOWER(display_name) LIKE ? THEN 3
          ELSE 4
        END as relevance_rank
      FROM users
      WHERE LOWER(username) LIKE ? OR LOWER(display_name) LIKE ?
      ORDER BY relevance_rank ASC, is_creator DESC, username ASC
      LIMIT 20
    `, [exactTerm, prefixTerm, prefixTerm, partialTerm, partialTerm]);
  }

  // Deduplicate by user ID
  const seenIds = new Set();
  const uniqueUsers = users.filter(u => {
    if (!u.id || seenIds.has(u.id)) return false;
    seenIds.add(u.id);
    return true;
  });

  // Compute follower count & isFollowing state for each user
  const results = await Promise.all(uniqueUsers.map(async (u) => {
    const followerRow = await dbGet('SELECT COUNT(*) as count FROM follows WHERE following_user_id = ?', [u.id]);
    let isFollowing = false;
    if (currentUserId && currentUserId !== u.id) {
      const followRow = await dbGet('SELECT id FROM follows WHERE follower_user_id = ? AND following_user_id = ?', [currentUserId, u.id]);
      isFollowing = !!followRow;
    }

    return {
      id: u.id,
      username: u.username,
      displayName: u.display_name,
      avatarUrl: u.avatar_url,
      bio: u.bio,
      isCreator: Boolean(u.is_creator),
      followerCount: followerRow ? followerRow.count : 0,
      isFollowing
    };
  }));

  return results;
};

// Get Public User Profile (EMAIL PRIVACY ENFORCED)
export const getUserProfile = async (targetUsername, currentUserId = null) => {
  const cleanUsername = targetUsername.trim().toLowerCase();
  const user = await dbGet(`
    SELECT id, firebase_uid, username, display_name, avatar_url, bio, is_creator, created_at
    FROM users
    WHERE LOWER(username) = ?
  `, [cleanUsername]);

  if (!user) return null;

  const followersRow = await dbGet('SELECT COUNT(*) as count FROM follows WHERE following_user_id = ?', [user.id]);
  const followingRow = await dbGet('SELECT COUNT(*) as count FROM follows WHERE follower_user_id = ?', [user.id]);

  let isFollowing = false;
  if (currentUserId && currentUserId !== user.id) {
    const followRow = await dbGet('SELECT id FROM follows WHERE follower_user_id = ? AND following_user_id = ?', [currentUserId, user.id]);
    isFollowing = !!followRow;
  }

  return {
    id: user.id,
    username: user.username,
    displayName: user.display_name,
    avatarUrl: user.avatar_url,
    bio: user.bio,
    isCreator: Boolean(user.is_creator),
    createdAt: user.created_at,
    followerCount: followersRow ? followersRow.count : 0,
    followingCount: followingRow ? followingRow.count : 0,
    isFollowing,
    isSelf: currentUserId === user.id
  };
};

// Update User Profile
export const updateUserProfile = async (uid, { username, displayName, bio, avatarUrl, isCreator }) => {
  let existing = await dbGet('SELECT * FROM users WHERE firebase_uid = ? OR id = ?', [uid, uid]);
  if (!existing) {
    await syncFirebaseUser(uid, `${uid}@scrollnom.com`, displayName || 'ScrollNom Creator');
    existing = await dbGet('SELECT * FROM users WHERE firebase_uid = ? OR id = ?', [uid, uid]);
  }

  let newUsername = existing.username;
  if (username && username.trim().toLowerCase() !== existing.username) {
    const avail = await checkUsernameAvailable(username, existing.id);
    if (!avail.available) {
      throw new Error(avail.reason || 'Username is already taken');
    }
    newUsername = avail.username;
  }

  const newDisplayName = displayName || existing.display_name;
  const newBio = bio !== undefined ? bio : existing.bio;
  const newAvatar = avatarUrl || existing.avatar_url;
  const newCreator = isCreator !== undefined ? (isCreator ? 1 : 0) : existing.is_creator;

  await dbRun(`
    UPDATE users
    SET username = ?, display_name = ?, bio = ?, avatar_url = ?, is_creator = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? OR firebase_uid = ?
  `, [newUsername, newDisplayName, newBio, newAvatar, newCreator, existing.id, existing.firebase_uid || uid]);

  return await getUserProfile(newUsername, uid);
};
