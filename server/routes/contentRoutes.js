import express from 'express';
import {
  handleGetFollowingFeed,
  handleGetSuggestedCreators,
  handleCreateContent,
  handleAnalyzeVideo,
  handleLikeContent,
  handleUnlikeContent,
  handleSaveContent,
  handleUnsaveContent,
  handleGetSavedContent,
  handleGetUserContent,
  handleGetPublicNommlyContent,
  handleGetCreatorContent
} from '../controllers/contentController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { optionalAuth } from '../middleware/optionalAuth.js';

const router = express.Router();

// Feed & Discovery Endpoints
router.get('/feed/following', requireAuth, handleGetFollowingFeed);
router.get('/feed/suggested', optionalAuth, handleGetSuggestedCreators);
router.get('/content/nommly', optionalAuth, handleGetPublicNommlyContent);
router.get('/content/creator/:username', optionalAuth, handleGetCreatorContent);

// Content Creation & Interactive Endpoints
router.post('/creator/analyze-video', requireAuth, handleAnalyzeVideo);
router.post('/content', requireAuth, handleCreateContent);

router.get('/content/my', requireAuth, handleGetUserContent);
router.post('/content/:id/like', requireAuth, handleLikeContent);
router.delete('/content/:id/like', requireAuth, handleUnlikeContent);
router.post('/content/:id/save', requireAuth, handleSaveContent);
router.delete('/content/:id/save', requireAuth, handleUnsaveContent);
router.get('/content/saved', requireAuth, handleGetSavedContent);

export default router;

