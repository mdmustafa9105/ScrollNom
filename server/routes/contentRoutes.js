import express from 'express';
import {
  handleGetFollowingFeed,
  handleGetSuggestedCreators,
  handleCreateContent,
  handleLikeContent,
  handleUnlikeContent,
  handleSaveContent,
  handleUnsaveContent,
  handleGetSavedContent,
  handleGetUserContent
} from '../controllers/contentController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { optionalAuth } from '../middleware/optionalAuth.js';

const router = express.Router();

// Feed & Discovery Endpoints
router.get('/feed/following', requireAuth, handleGetFollowingFeed);
router.get('/feed/suggested', optionalAuth, handleGetSuggestedCreators);

// Content Creation & Interactive Endpoints
router.post('/content', requireAuth, handleCreateContent);
router.get('/content/my', requireAuth, handleGetUserContent);
router.post('/content/:id/like', requireAuth, handleLikeContent);
router.delete('/content/:id/like', requireAuth, handleUnlikeContent);
router.post('/content/:id/save', requireAuth, handleSaveContent);
router.delete('/content/:id/save', requireAuth, handleUnsaveContent);
router.get('/content/saved', requireAuth, handleGetSavedContent);

export default router;
