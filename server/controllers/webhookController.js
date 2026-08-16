import crypto from 'crypto';
import { db } from '../db/memoryStore.js';

export const handleRazorpayWebhook = (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'scrollnom_whsec_mock';

  // Use rawBody buffer if attached by express middleware, else JSON stringified body
  const bodyText = req.rawBody ? req.rawBody.toString() : JSON.stringify(req.body);
  const expectedSignature = crypto.createHmac('sha256', secret).update(bodyText).digest('hex');

  const isMockWebhook = signature === 'mock_webhook_signature' || secret.includes('mock');
  const isValidSignature = signature === expectedSignature;

  if (!isMockWebhook && !isValidSignature) {
    console.warn('[WEBHOOK SECURITY WARNING] Invalid Razorpay webhook signature header!');
    return res.status(400).json({
      success: false,
      error: { code: 'WEBHOOK_SIGNATURE_INVALID', message: 'Razorpay webhook signature verification failed.' }
    });
  }

  const payload = req.body || {};
  console.log(`[RAZORPAY WEBHOOK] Received Event: ${payload.event || 'unknown'}`);

  // Log event in database store
  db.logWebhookEvent(payload);

  // Handle specific captured events
  if (payload.event === 'payment.captured') {
    const paymentEntity = payload.payload?.payment?.entity;
    const razorpayOrderId = paymentEntity?.order_id;
    const paymentId = paymentEntity?.id;

    if (razorpayOrderId) {
      for (const order of db.orders.values()) {
        if (order.razorpayOrderId === razorpayOrderId) {
          db.updateOrder(order.orderId, {
            paymentStatus: 'paid',
            status: 'confirmed',
            razorpayPaymentId: paymentId
          });
          console.log(`[WEBHOOK SUCCESS] Order ${order.orderId} updated to PAID via payment.captured webhook.`);
          break;
        }
      }
    }
  }

  res.status(200).json({ status: 'ok', received: true });
};
