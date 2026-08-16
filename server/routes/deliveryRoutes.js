import express from 'express';
import {
  getAdaptersStatus,
  getTrackingData,
  streamDeliveryUpdates,
  simulateDeliveryStep
} from '../controllers/deliveryController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { optionalAuth } from '../middleware/optionalAuth.js';

const router = express.Router();

// Delivery API Endpoints
router.get('/delivery/adapters', getAdaptersStatus);
router.get('/delivery/:deliveryId/tracking', requireAuth, getTrackingData);
router.get('/delivery/:deliveryId/stream', optionalAuth, streamDeliveryUpdates);
router.post('/delivery/:deliveryId/simulate-step', requireAuth, simulateDeliveryStep);

export default router;
