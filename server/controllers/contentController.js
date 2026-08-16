import {
  createContent,
  likeContent,
  unlikeContent,
  saveContent,
  unsaveContent,
  getUserSavedContent,
  getUserContent,
  getPublicNommlyContent,
  getCreatorContentByUsername
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

export const handleAnalyzeVideo = async (req, res, next) => {
  try {
    const { videoFileName, videoUrl } = req.body;
    const nameLower = (videoFileName || videoUrl || '').toLowerCase();

    let detectedDishes = [];
    let categories = [];
    let timeBelts = [];
    let restaurantId = 'r1';
    let restaurantName = 'Paradise Biryani Palace';

    if (nameLower.includes('breakfast')) {
      restaurantId = 'r3';
      restaurantName = 'CTR Benne Dosa - Malleshwaram';
      categories = ['BREAKFAST', 'BEVERAGE'];
      timeBelts = ['MORNING'];
      detectedDishes = [
        { dishId: 'd3_1', name: 'Ghee Roast Benne Dosa', dietType: 'VEG', category: 'BREAKFAST', price: 140, confidence: 0.98 },
        { dishId: 'd3_3', name: 'Authentic Filter Coffee', dietType: 'VEG', category: 'BEVERAGE', price: 45, confidence: 0.96 }
      ];
    } else if (nameLower.includes('evening') || nameLower.includes('burger')) {
      restaurantId = 'r2';
      restaurantName = 'The Smashed Patty Co. - Koramangala';
      categories = ['MAIN_FOOD', 'SNACK', 'BEVERAGE'];
      timeBelts = ['AFTERNOON_EVENING_MIX', 'EVENING'];
      detectedDishes = [
        { dishId: 'd2_1', name: 'Ultimate Smashed Truffle Cheeseburger', dietType: 'NON_VEG', category: 'MAIN_FOOD', price: 320, discountPercent: 20, promoCode: 'BURGER20', confidence: 0.98 },
        { dishId: 'd2_3', name: 'Loaded Animal Fries', dietType: 'VEG', category: 'SNACK', price: 180, confidence: 0.95 }
      ];
    } else if (nameLower.includes('overnight') || nameLower.includes('late')) {
      restaurantId = 'r1';
      restaurantName = 'Paradise Biryani Palace';
      categories = ['MAIN_FOOD', 'BEVERAGE'];
      timeBelts = ['OVERNIGHT'];
      detectedDishes = [
        { dishId: 'd1_2', name: 'Special Mutton Biryani', dietType: 'NON_VEG', category: 'MAIN_FOOD', price: 450, discountPercent: 50, promoCode: 'SCROLL50', confidence: 0.99 },
        { dishId: 'd1_5', name: 'Chilled Cold Coffee', dietType: 'VEG', category: 'BEVERAGE', price: 150, confidence: 0.93 }
      ];
    } else {
      // Default lunch / biryani detection
      restaurantId = 'r1';
      restaurantName = 'Paradise Biryani Palace';
      categories = ['MAIN_FOOD', 'SNACK'];
      timeBelts = ['AFTERNOON', 'EVENING'];
      detectedDishes = [
        { dishId: 'd1_1', name: 'Hyderabadi Dum Biryani', dietType: 'NON_VEG', category: 'MAIN_FOOD', price: 380, discountPercent: 50, promoCode: 'SCROLL50', confidence: 0.99 },
        { dishId: 'd1_4', name: 'Chicken 65', dietType: 'NON_VEG', category: 'SNACK', price: 260, confidence: 0.94 }
      ];
    }

    res.json({
      success: true,
      data: {
        analysisStatus: 'detected',
        restaurantId,
        restaurantName,
        detectedDishes,
        categories,
        timeBelts
      }
    });
  } catch (error) {
    next(error);
  }
};

export const handleCreateContent = async (req, res, next) => {
  try {
    const userUid = req.user.uid;
    const { mediaUrl, contentType, caption, dishId, dishTitle, dishPrice, restaurantId, restaurantName, posterUrl, taggedDishes, categories, timeBelts } = req.body;

    if (!mediaUrl) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_CONTENT', message: 'Media URL is required to publish content.' }
      });
    }

    const content = await createContent(userUid, {
      contentType, mediaUrl, caption, dishId, dishTitle, dishPrice, restaurantId, restaurantName, posterUrl, taggedDishes, categories, timeBelts
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

export const handleGetPublicNommlyContent = async (req, res, next) => {
  try {
    const userUid = req.user?.uid || null;
    const items = await getPublicNommlyContent(userUid);
    res.json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
};

export const handleGetCreatorContent = async (req, res, next) => {
  try {
    const userUid = req.user?.uid || null;
    const { username } = req.params;
    const items = await getCreatorContentByUsername(username, userUid);
    res.json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
};

