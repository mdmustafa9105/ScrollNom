import express from 'express';
import {
  handleGetRestaurants,
  handleGetRestaurantMenu,
  handleAddOrUpdateMenuItem
} from '../controllers/restaurantController.js';
import { optionalAuth } from '../middleware/optionalAuth.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = express.Router();

// Public Restaurant & Canonical Menu Endpoints
router.get('/restaurants', optionalAuth, handleGetRestaurants);
router.get('/restaurants/:id/menu', optionalAuth, handleGetRestaurantMenu);

// Restaurant Operations / Owner Menu Management
router.post('/restaurants/:id/menu', requireAuth, handleAddOrUpdateMenuItem);

export default router;
