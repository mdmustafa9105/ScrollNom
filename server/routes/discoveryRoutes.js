import express from 'express';
import {
  handleGetNearbyDiscovery,
  handleGetTimeBeltInfo,
  handleRecordDiscoverySignal
} from '../controllers/discoveryController.js';
import { optionalAuth } from '../middleware/optionalAuth.js';

const router = express.Router();

router.get('/discovery/nearby', optionalAuth, handleGetNearbyDiscovery);
router.get('/discovery/time-belt', optionalAuth, handleGetTimeBeltInfo);
router.post('/discovery/signals', optionalAuth, handleRecordDiscoverySignal);

export default router;
