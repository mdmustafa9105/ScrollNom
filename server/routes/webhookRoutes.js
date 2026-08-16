import express from 'express';
import { handleRazorpayWebhook } from '../controllers/webhookController.js';

const router = express.Router();

router.post('/webhooks/razorpay', handleRazorpayWebhook);

export default router;
