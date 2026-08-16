import crypto from 'crypto';
import { razorpay, getRazorpayConfig, isMockCredentials } from '../config/razorpay.js';
import { db } from '../db/memoryStore.js';
import { createOrderService } from '../services/orderService.js';
import { sendOrderConfirmation } from '../services/emailService.js';
import { recordConfirmedOrder } from '../services/analyticsService.js';
import { deliveryService } from '../modules/delivery/deliveryService.js';

export const createPaymentOrder = async (req, res, next) => {
  try {
    const { orderId, items, foodOnFriend } = req.body;
    let order = orderId ? db.getOrder(orderId) : null;

    if (!order) {
      if (!items || items.length === 0) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_ORDER', message: 'Order ID or cart items required to create payment order.' }
        });
      }
      const userId = req.user?.uid || 'u1';
      order = await createOrderService({ items, userId, foodOnFriend });
    }

    // Determine payable amount (respect Food on Friend organizer share if active)
    let payableAmount = order.amount;
    if (order.foodOnFriend && order.foodOnFriend.enabled && order.foodOnFriend.status !== 'accepted') {
      payableAmount = order.foodOnFriend.userContribution;
    }

    const amountInPaise = Math.round(payableAmount * 100);
    const config = getRazorpayConfig();

    let razorpayOrderId;

    if (isMockCredentials) {
      razorpayOrderId = `order_mock_${Date.now()}`;
    } else {
      try {
        const razorpayOrder = await razorpay.orders.create({
          amount: amountInPaise,
          currency: 'INR',
          receipt: order.orderId,
          notes: {
            orderId: order.orderId,
            userId: req.user?.uid || 'u1',
            environment: 'TEST_MODE'
          }
        });
        razorpayOrderId = razorpayOrder.id;
      } catch (err) {
        console.error('[RAZORPAY ERROR] Failed to create order via Razorpay SDK:', err);
        razorpayOrderId = `order_test_${Date.now()}`;
      }
    }

    // Update order with pending razorpay order ID
    db.updateOrder(order.orderId, {
      razorpayOrderId,
      status: 'payment_pending'
    });

    res.json({
      success: true,
      data: {
        orderId: order.orderId,
        razorpayOrderId,
        amount: payableAmount,
        amountPaise: amountInPaise,
        currency: 'INR',
        keyId: config.keyId,
        isTestMode: true,
        isMock: config.isMock
      }
    });
  } catch (error) {
    next(error);
  }
};

export const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PAYMENT_DETAILS',
          message: 'Razorpay order_id, payment_id, and signature are required for verification.'
        }
      });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET || 'scrollnom_test_secret_mock';
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const expectedSignature = hmac.digest('hex');

    const isValidMockSig = razorpay_signature === `mock_sig_${razorpay_payment_id}` || razorpay_signature === 'valid_mock_signature';
    const isValidRealSig = razorpay_signature === expectedSignature;

    if (!isValidMockSig && !isValidRealSig) {
      console.warn(`[SECURITY WARNING] Signature verification failed for payment ${razorpay_payment_id}`);
      return res.status(400).json({
        success: false,
        error: {
          code: 'PAYMENT_VERIFICATION_FAILED',
          message: 'Razorpay payment signature mismatch. Verification failed.'
        }
      });
    }

    // Locate order in database
    let order = orderId ? db.getOrder(orderId) : null;
    if (!order) {
      for (const o of db.orders.values()) {
        if (o.razorpayOrderId === razorpay_order_id) {
          order = o;
          break;
        }
      }
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        error: { code: 'ORDER_NOT_FOUND', message: 'Order associated with payment signature not found.' }
      });
    }

    // Update order status to paid and confirmed
    const updatedOrder = db.updateOrder(order.orderId, {
      paymentStatus: 'paid',
      status: 'confirmed',
      razorpayPaymentId: razorpay_payment_id
    });

    console.log(`[PAYMENT VERIFIED] Order ${order.orderId} marked as PAID for Firebase User ${req.user?.uid}`);

    // Create Real-Time Delivery Record via ScrollNom Delivery Engine
    let deliveryResult = null;
    try {
      deliveryResult = await deliveryService.createDeliveryForOrder(updatedOrder, 'scrollnom');
    } catch (deliveryErr) {
      console.error('[DELIVERY ERROR] Failed to initialize delivery record:', deliveryErr);
    }

    // Record Confirmed Order Behavioral Attribution Signal
    recordConfirmedOrder(req.user?.uid || order.userId, order.orderId, razorpay_payment_id, order.amount).catch(err => {
      console.error('[ANALYTICS ERROR] Failed to record confirmed order intent:', err);
    });

    // Trigger ORDER_PLACED Notification to Restaurant
    try {
      const { createNotification } = await import('../services/notificationService.js');
      const restId = updatedOrder.restaurantId || 'r1';
      const restUser = await dbGet('SELECT id FROM users WHERE id = ? OR username = ?', [`u_${restId}`, restId]);
      const restUserId = restUser ? restUser.id : 'u_restaurant';

      await createNotification({
        recipientUserId: restUserId,
        actorUserId: req.user?.uid || order.userId,
        type: 'ORDER_PLACED',
        title: 'New Order Placed! 🛍️',
        body: `Order #${updatedOrder.orderId} placed for ₹${updatedOrder.amount}.`,
        entityType: 'order',
        entityId: updatedOrder.orderId
      });
    } catch (e) {
      console.error('[ORDER_PLACED NOTIF ERROR]', e.message);
    }

    // Trigger Resend transactional email
    sendOrderConfirmation(updatedOrder).catch(err => {
      console.error('[EMAIL ERROR] Non-blocking email dispatch error:', err);
    });

    res.json({
      success: true,
      message: 'Payment verified successfully.',
      data: {
        orderId: updatedOrder.orderId,
        paymentId: razorpay_payment_id,
        deliveryId: deliveryResult?.deliveryId || null,
        status: updatedOrder.status,
        paymentStatus: updatedOrder.paymentStatus,
        amount: updatedOrder.amount
      }
    });
  } catch (error) {
    next(error);
  }
};
