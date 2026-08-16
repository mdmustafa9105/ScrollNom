import express from 'express';
import {
  createCollaborationRequest,
  getCreatorCollaborations,
  getRestaurantCollaborations,
  updateCollaborationStatus
} from '../controllers/collaborationController.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = express.Router();

router.post('/collaborations', requireAuth, createCollaborationRequest);
router.get('/creator/collaborations', requireAuth, getCreatorCollaborations);
router.get('/restaurant/collaborations', getRestaurantCollaborations);
router.patch('/restaurant/collaborations/:id/status', updateCollaborationStatus);

export default router;
