import express from 'express';
import {
  getRestaurantOrders,
  getRiderDeliveries,
  updateDeliveryStatus
} from '../controllers/opsController.js';

const router = express.Router();

// Operations Endpoints (Accessible across 3-Laptop LAN setup)
router.get('/restaurant/orders', getRestaurantOrders);
router.get('/rider/deliveries', getRiderDeliveries);
router.patch('/delivery/:deliveryId/status', updateDeliveryStatus);

export default router;
