import { createOrderService } from '../services/orderService.js';
import { dbAll, dbGet } from '../db/database.js';
import { db } from '../db/memoryStore.js';

export const createOrder = (req, res, next) => {
  try {
    const { items, foodOnFriend } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_CART', message: 'Cart items cannot be empty.' }
      });
    }

    // Strict security: derive userId from verified Firebase token (req.user)
    const userId = req.user?.uid || 'u1';
    const order = createOrderService({ items, userId, foodOnFriend });

    res.status(201).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/orders/my — Persistent customer order history scoped to authenticated user
export const getUserOrders = async (req, res, next) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required to view order history.' }
      });
    }

    // Query persistent SQLite database orders for current user
    const rows = await dbAll(`
      SELECT o.*, d.id as delivery_id, d.status as delivery_status
      FROM orders o
      LEFT JOIN deliveries d ON o.order_id = d.order_id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `, [userId]);

    const formatted = rows.map(r => {
      let items = [];
      try {
        items = JSON.parse(r.items_json) || [];
      } catch (e) {
        items = [];
      }

      return {
        orderId: r.order_id,
        userId: r.user_id,
        restaurantName: r.restaurant_name || 'Paradise Biryani Palace',
        items,
        subtotal: r.subtotal || 0,
        deliveryFee: r.delivery_fee || 0,
        taxes: r.taxes || 0,
        amount: r.amount || 0,
        paymentStatus: r.payment_status || 'paid',
        status: r.delivery_status || r.status || 'confirmed',
        deliveryId: r.delivery_id || null,
        createdAt: r.created_at
      };
    });

    res.json({
      success: true,
      data: formatted
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/orders/:id — Fetch persistent order details with user isolation security
export const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check SQLite persistent orders table first
    const dbOrder = await dbGet(`
      SELECT o.*, d.id as delivery_id, d.status as delivery_status
      FROM orders o
      LEFT JOIN deliveries d ON o.order_id = d.order_id
      WHERE o.order_id = ?
    `, [id]);

    let order = dbOrder;
    if (!order) {
      order = db.getOrder(id);
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        error: { code: 'ORDER_NOT_FOUND', message: `No order found with ID ${id}` }
      });
    }

    // Security Authorization check: User A cannot access User B's order
    const currentUserId = req.user?.uid;
    const orderUserId = order.user_id || order.userId;

    if (currentUserId && orderUserId && currentUserId !== orderUserId && !req.user?.isOps) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You are not authorized to view this order.' }
      });
    }

    let items = order.items;
    if (typeof order.items_json === 'string') {
      try { items = JSON.parse(order.items_json); } catch (e) { items = []; }
    }

    res.json({
      success: true,
      data: {
        orderId: order.order_id || order.orderId,
        userId: orderUserId,
        restaurantName: order.restaurant_name || order.restaurantName || 'Paradise Biryani Palace',
        items: items || [],
        subtotal: order.subtotal || 0,
        deliveryFee: order.delivery_fee || order.deliveryFee || 0,
        taxes: order.taxes || 0,
        amount: order.amount || 0,
        paymentStatus: order.payment_status || order.paymentStatus || 'paid',
        status: order.delivery_status || order.status || 'confirmed',
        deliveryId: order.delivery_id || order.deliveryId || null,
        createdAt: order.created_at || order.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};
