import express from 'express';
import { createSplitRequest, updateSplitStatus, getSplitRequestById } from '../controllers/foodOnFriendController.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = express.Router();

router.post('/food-on-friend/request', requireAuth, createSplitRequest);
router.patch('/food-on-friend/:requestId/status', requireAuth, updateSplitStatus);
router.get('/food-on-friend/:requestId', getSplitRequestById);

export default router;
