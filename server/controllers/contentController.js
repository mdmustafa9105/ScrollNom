import {
  createContent,
  likeContent,
  unlikeContent,
  saveContent,
  unsaveContent,
  getUserSavedContent,
  getUserContent
} from '../services/contentService.js';
import {
  getFollowingFeed,
  getSuggestedCreators
} from '../services/feedService.js';

export const handleGetFollowingFeed = async (req, res, next) => {
  try {
    const userUid = req.user.uid;
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const feed = await getFollowingFeed(userUid, page, limit);
    res.json({ success: true, data: feed });
  } catch (error) {
    next(error);
  }
};

export const handleGetSuggestedCreators = async (req, res, next) => {
  try {
    const userUid = req.user?.uid || null;
    const creators = await getSuggestedCreators(userUid);
    res.json({ success: true, data: creators });
  } catch (error) {
    next(error);
  }
};

export const handleCreateContent = async (req, res, next) => {
  try {
    const userUid = req.user.uid;
    const { mediaUrl, contentType, caption, dishId, dishTitle, dishPrice, restaurantName, posterUrl } = req.body;

    if (!mediaUrl) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_CONTENT', message: 'Media URL is required to publish content.' }
      });
    }

    const content = await createContent(userUid, {
      contentType, mediaUrl, caption, dishId, dishTitle, dishPrice, restaurantName, posterUrl
    });

    res.status(201).json({ success: true, data: content });
  } catch (error) {
    next(error);
  }
};

export const handleLikeContent = async (req, res, next) => {
  try {
    const userUid = req.user.uid;
    const { id } = req.params;
    const result = await likeContent(userUid, id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const handleUnlikeContent = async (req, res, next) => {
  try {
    const userUid = req.user.uid;
    const { id } = req.params;
    const result = await unlikeContent(userUid, id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const handleSaveContent = async (req, res, next) => {
  try {
    const userUid = req.user.uid;
    const { id } = req.params;
    const result = await saveContent(userUid, id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const handleUnsaveContent = async (req, res, next) => {
  try {
    const userUid = req.user.uid;
    const { id } = req.params;
    const result = await unsaveContent(userUid, id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const handleGetSavedContent = async (req, res, next) => {
  try {
    const userUid = req.user.uid;
    const items = await getUserSavedContent(userUid);
    res.json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
};

export const handleGetUserContent = async (req, res, next) => {
  try {
    const userUid = req.user.uid;
    const items = await getUserContent(userUid);
    res.json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
};
