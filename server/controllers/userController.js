import {
  checkUsernameAvailable,
  syncFirebaseUser,
  searchUsers,
  getUserProfile,
  updateUserProfile
} from '../services/userService.js';
import {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing
} from '../services/socialService.js';

export const checkUsername = async (req, res, next) => {
  try {
    const { username } = req.query;
    if (!username) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_QUERY', message: 'Username query parameter is required.' }
      });
    }
    const currentUserId = req.user?.uid || null;
    const result = await checkUsernameAvailable(username, currentUserId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const claimUsername = async (req, res, next) => {
  try {
    const { uid } = req.user;
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_USERNAME', message: 'Username is required.' }
      });
    }

    const updated = await updateUserProfile(uid, { username });
    res.json({ success: true, data: { user: updated } });
  } catch (error) {
    if (error.message && error.message.includes('already taken')) {
      return res.status(400).json({
        success: false,
        error: { code: 'USERNAME_TAKEN', message: error.message }
      });
    }
    next(error);
  }
};

export const syncUserOnAuth = async (req, res, next) => {
  try {
    const { uid, email, name } = req.user;
    const user = await syncFirebaseUser(uid, email, name);
    res.json({ success: true, data: { user, needsUsername: !user.username } });
  } catch (error) {
    next(error);
  }
};

export const searchUserProfiles = async (req, res, next) => {
  try {
    const { q } = req.query;
    const currentUserId = req.user?.uid;
    const results = await searchUsers(q || '', currentUserId);
    res.json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
};

export const getPublicProfile = async (req, res, next) => {
  try {
    const { username } = req.params;
    const currentUserId = req.user?.uid;
    const profile = await getUserProfile(username, currentUserId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: `User @${username} not found.` }
      });
    }

    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { uid } = req.user;
    const { username, displayName, bio, avatarUrl, isCreator } = req.body;
    const updated = await updateUserProfile(uid, { username, displayName, bio, avatarUrl, isCreator });
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const handleFollow = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const followerUid = req.user.uid;
    const result = await followUser(followerUid, userId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const handleUnfollow = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const followerUid = req.user.uid;
    const result = await unfollowUser(followerUid, userId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const handleGetFollowers = async (req, res, next) => {
  try {
    const { username } = req.params;
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const currentUserId = req.user?.uid;
    const result = await getFollowers(username, currentUserId, page, limit);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const handleGetFollowing = async (req, res, next) => {
  try {
    const { username } = req.params;
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const currentUserId = req.user?.uid;
    const result = await getFollowing(username, currentUserId, page, limit);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
