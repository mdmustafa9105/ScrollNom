import express from 'express';
import { createOrder, getUserOrders, getOrderById } from '../controllers/orderController.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = express.Router();

router.post('/orders', requireAuth, createOrder);
router.get('/orders/my', requireAuth, getUserOrders);
router.get('/orders/:id', requireAuth, getOrderById);

export default router;
