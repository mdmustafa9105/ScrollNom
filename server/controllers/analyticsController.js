import { recordViewEvent, recordOrderIntent } from '../services/analyticsService.js';

export const handleRecordView = async (req, res, next) => {
  try {
    const userUid = req.user.uid;
    const { contentId } = req.body;
    if (!contentId) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_EVENT', message: 'contentId is required for view event.' }
      });
    }
    const result = await recordViewEvent(userUid, contentId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const handleRecordOrderIntent = async (req, res, next) => {
  try {
    const userUid = req.user.uid;
    const { contentId, dishId, restaurantName } = req.body;
    if (!dishId) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_EVENT', message: 'dishId is required for order intent event.' }
      });
    }
    const result = await recordOrderIntent(userUid, contentId, dishId, restaurantName);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
