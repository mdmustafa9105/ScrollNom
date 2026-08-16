import express from 'express';
import {
  checkUsername,
  claimUsername,
  syncUserOnAuth,
  searchUserProfiles,
  getPublicProfile,
  updateProfile,
  handleFollow,
  handleUnfollow,
  handleGetFollowers,
  handleGetFollowing
} from '../controllers/userController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { optionalAuth } from '../middleware/optionalAuth.js';

const router = express.Router();

// Public / Utility Endpoints
router.get('/users/check-username', optionalAuth, checkUsername);
router.get('/users/search', optionalAuth, searchUserProfiles);
router.get('/users/profile/:username', optionalAuth, getPublicProfile);
router.get('/users/:username/followers', optionalAuth, handleGetFollowers);
router.get('/users/:username/following', optionalAuth, handleGetFollowing);

// Protected Endpoints
router.post('/users/sync', requireAuth, syncUserOnAuth);
router.post('/users/claim-username', requireAuth, claimUsername);
router.put('/users/profile', requireAuth, updateProfile);
router.post('/users/:userId/follow', requireAuth, handleFollow);
router.delete('/users/:userId/follow', requireAuth, handleUnfollow);

export default router;
