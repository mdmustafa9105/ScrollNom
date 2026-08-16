import express from 'express';
import { handleRecordView, handleRecordOrderIntent } from '../controllers/analyticsController.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = express.Router();

router.post('/analytics/view', requireAuth, handleRecordView);
router.post('/analytics/order-intent', requireAuth, handleRecordOrderIntent);

export default router;
