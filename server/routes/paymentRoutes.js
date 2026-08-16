import express from 'express';
import { createPaymentOrder, verifyPayment } from '../controllers/paymentController.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = express.Router();

router.post('/payments/create-order', requireAuth, createPaymentOrder);
router.post('/payments/verify', requireAuth, verifyPayment);

export default router;
