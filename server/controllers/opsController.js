import { dbAll, dbGet, dbRun } from '../db/database.js';
import { db } from '../db/memoryStore.js';
import { trackingService } from '../modules/delivery/tracking/trackingService.js';
import { scrollnomAdapter } from '../modules/delivery/providers/scrollnomAdapter.js';
import { createNotification } from '../services/notificationService.js';

// Active status definitions for operational queue filtering
const RESTAURANT_ACTIVE_STATUSES = ['restaurant_received', 'accepted', 'preparing', 'ready_for_pickup'];
const RIDER_ACTIVE_STATUSES = ['ready_for_pickup', 'rider_assigned', 'picked_up', 'out_for_delivery'];

// Map delivery status to Notification type, title, and body
const getOrderNotificationConfig = (status, orderId, restaurantName) => {
  switch (status) {
    case 'accepted':
      return { type: 'ORDER_ACCEPTED', title: 'Order Accepted! 🍳', body: `${restaurantName || 'Restaurant'} accepted order #${orderId}` };
    case 'preparing':
      return { type: 'ORDER_PREPARING', title: 'Kitchen Preparing Food! 🍲', body: `${restaurantName || 'Kitchen'} is preparing order #${orderId}` };
    case 'ready_for_pickup':
    case 'ready':
      return { type: 'ORDER_READY', title: 'Order Ready for Pickup! 📦', body: `Order #${orderId} is packed and ready for delivery.` };
    case 'rider_assigned':
      return { type: 'RIDER_ASSIGNED', title: 'Rider Assigned! 🚴', body: `A delivery partner has been assigned to order #${orderId}` };
    case 'picked_up':
      return { type: 'ORDER_PICKED_UP', title: 'Order Picked Up! 🛵', body: `Rider has picked up order #${orderId} from ${restaurantName}` };
    case 'out_for_delivery':
      return { type: 'ORDER_OUT_FOR_DELIVERY', title: 'Out for Delivery! 🚚', body: `Your order #${orderId} is on the way!` };
    case 'delivered':
      return { type: 'ORDER_DELIVERED', title: 'Order Delivered! 🎉', body: `Order #${orderId} has been delivered. Enjoy your meal!` };
    default:
      return null;
  }
};

// Get Restaurant Active Orders (filtered to kitchen-actionable statuses only)
export const getRestaurantOrders = async (req, res, next) => {
  try {
    const placeholders = RESTAURANT_ACTIVE_STATUSES.map(() => '?').join(', ');
    const rows = await dbAll(`
      SELECT d.id as delivery_id, d.order_id, d.status as delivery_status, d.provider,
             d.rider_name, d.rider_phone_masked, d.rider_lat, d.rider_lng, d.eta_minutes, d.created_at,
             o.items_json, o.restaurant_name, o.amount, o.payment_status
      FROM deliveries d
      LEFT JOIN orders o ON d.order_id = o.order_id
      WHERE d.status IN (${placeholders})
      ORDER BY d.created_at DESC
      LIMIT 20
    `, RESTAURANT_ACTIVE_STATUSES);

    const formatted = rows.map(r => {
      let items = [];
      try {
        items = JSON.parse(r.items_json) || [];
      } catch (e) {
        items = [];
      }

      if (!Array.isArray(items)) items = [];

      // Cross-reference memoryStore for items if empty
      const memOrder = db.getOrder ? db.getOrder(r.order_id) : null;
      if (items.length === 0 && memOrder) {
        items = memOrder.items || [];
      }

      return {
        deliveryId: r.delivery_id,
        orderId: r.order_id,
        status: r.delivery_status,
        provider: r.provider,
        restaurantName: r.restaurant_name || 'Paradise Biryani Palace',
        items,
        amount: r.amount || (memOrder ? memOrder.amount : 380),
        paymentStatus: r.payment_status || 'paid',
        riderName: r.rider_name,
        etaMinutes: r.eta_minutes,
        createdAt: r.created_at
      };
    });

    res.json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
};

// Get Delivery Rider Jobs (filtered to rider-actionable statuses only)
export const getRiderDeliveries = async (req, res, next) => {
  try {
    const placeholders = RIDER_ACTIVE_STATUSES.map(() => '?').join(', ');
    const rows = await dbAll(`
      SELECT d.*, o.restaurant_name, o.amount, o.items_json
      FROM deliveries d
      LEFT JOIN orders o ON d.order_id = o.order_id
      WHERE d.status IN (${placeholders})
      ORDER BY d.created_at DESC
      LIMIT 20
    `, RIDER_ACTIVE_STATUSES);

    const formatted = rows.map(r => ({
      deliveryId: r.id,
      orderId: r.order_id,
      status: r.status,
      provider: r.provider,
      restaurantName: r.restaurant_name || 'Paradise Biryani Palace',
      riderName: r.rider_name,
      riderPhoneMasked: r.rider_phone_masked,
      pickupLocation: { latitude: r.pickup_lat, longitude: r.pickup_lng, name: 'Paradise Biryani Palace' },
      deliveryLocation: { latitude: r.delivery_lat, longitude: r.delivery_lng, address: 'Banjara Hills, Hyderabad' },
      riderLocation: { latitude: r.rider_lat, longitude: r.rider_lng },
      etaMinutes: r.eta_minutes,
      createdAt: r.created_at
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
};

// Update Delivery State Machine & Broadcast Real-Time Updates
export const updateDeliveryStatus = async (req, res, next) => {
  try {
    const { deliveryId } = req.params;
    const { status, latitude, longitude, message } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATUS', message: 'Status is required.' }
      });
    }

    const delivery = await dbGet('SELECT * FROM deliveries WHERE id = ?', [deliveryId]);
    if (!delivery) {
      return res.status(404).json({
        success: false,
        error: { code: 'DELIVERY_NOT_FOUND', message: `Delivery ${deliveryId} not found.` }
      });
    }

    const newLat = latitude !== undefined ? latitude : delivery.rider_lat;
    const newLng = longitude !== undefined ? longitude : delivery.rider_lng;
    let newEta = delivery.eta_minutes;

    if (status === 'delivered') newEta = 0;
    if (status === 'out_for_delivery') newEta = Math.max(5, newEta - 2);

    // Update SQLite database
    await dbRun(`
      UPDATE deliveries
      SET status = ?, rider_lat = ?, rider_lng = ?, eta_minutes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [status, newLat, newLng, newEta, deliveryId]);

    // Log audit event
    const eventMessage = message || `Status updated to ${status}`;
    await scrollnomAdapter.logEvent(deliveryId, status, newLat, newLng, { message: eventMessage });

    // Update associated order status
    await dbRun('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE order_id = ?', [status, delivery.order_id]);

    const updated = await dbGet('SELECT * FROM deliveries WHERE id = ?', [deliveryId]);

    // Broadcast SSE update to customer tracking channel
    const updatePayload = {
      deliveryId,
      orderId: delivery.order_id,
      provider: delivery.provider,
      status,
      message: eventMessage,
      etaMinutes: newEta,
      rider: {
        id: delivery.rider_id,
        name: delivery.rider_name,
        phoneMasked: delivery.rider_phone_masked,
        location: { latitude: newLat, longitude: newLng }
      },
      pickupLocation: { latitude: delivery.pickup_lat, longitude: delivery.pickup_lng },
      deliveryLocation: { latitude: delivery.delivery_lat, longitude: delivery.delivery_lng }
    };

    trackingService.broadcast(deliveryId, updatePayload);

    // Trigger Notification to Customer User
    try {
      const orderRow = await dbGet('SELECT user_id, restaurant_name FROM orders WHERE order_id = ?', [delivery.order_id]);
      const customerUserId = orderRow ? orderRow.user_id : (delivery.user_id || 'u1');
      const restaurantName = orderRow ? orderRow.restaurant_name : 'ScrollNom Partner';

      const notifConfig = getOrderNotificationConfig(status, delivery.order_id, restaurantName);
      if (notifConfig) {
        await createNotification({
          recipientUserId: customerUserId,
          actorUserId: 'u_restaurant',
          type: notifConfig.type,
          title: notifConfig.title,
          body: notifConfig.body,
          entityType: 'order',
          entityId: delivery.order_id
        });
      }
    } catch (e) {
      console.error('[ORDER STATUS NOTIF ERROR]', e.message);
    }

    console.log(`[OPS CONTROLLER] Real-Time Delivery ${deliveryId} status updated to '${status}' -> Broadcasted to SSE clients.`);

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};
