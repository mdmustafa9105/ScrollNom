import { BaseDeliveryAdapter } from '../deliveryAdapter.js';
import { dbGet, dbRun } from '../../../db/database.js';
import {
  DEFAULT_RESTAURANT_LOCATION,
  DEFAULT_CUSTOMER_LOCATION,
  calculateDistanceKm,
  calculateETA,
  interpolateLocation
} from '../tracking/locationService.js';
import { trackingService } from '../tracking/trackingService.js';
import { sendOrderConfirmation } from '../../../services/emailService.js';

export class ScrollNomAdapter extends BaseDeliveryAdapter {
  constructor() {
    super('scrollnom', true); // Active Development Delivery Provider
  }

  // Create Delivery Record & Start Rider Simulator
  async createDelivery(orderData) {
    const deliveryId = `del_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const orderId = orderData.orderId;
    const pickupLat = DEFAULT_RESTAURANT_LOCATION.latitude;
    const pickupLng = DEFAULT_RESTAURANT_LOCATION.longitude;
    const deliveryLat = DEFAULT_CUSTOMER_LOCATION.latitude;
    const deliveryLng = DEFAULT_CUSTOMER_LOCATION.longitude;

    const distanceKm = calculateDistanceKm(pickupLat, pickupLng, deliveryLat, deliveryLng);
    const etaMinutes = calculateETA(distanceKm);

    const rider = {
      id: 'rdr_101',
      name: 'Vikram Singh',
      phoneMasked: '+91 98*** **421'
    };

    // Insert persistent delivery record into SQLite
    await dbRun(`
      INSERT INTO deliveries (
        id, order_id, provider, status, rider_id, rider_name, rider_phone_masked,
        pickup_lat, pickup_lng, delivery_lat, delivery_lng, rider_lat, rider_lng, eta_minutes
      ) VALUES (?, ?, 'scrollnom', 'restaurant_received', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      deliveryId, orderId, rider.id, rider.name, rider.phoneMasked,
      pickupLat, pickupLng, deliveryLat, deliveryLng, pickupLat, pickupLng, etaMinutes
    ]);

    // Record initial event log
    await this.logEvent(deliveryId, 'restaurant_received', pickupLat, pickupLng, { message: 'Order received by restaurant' });

    // DISABLED: Auto-simulator was bypassing restaurant/rider UI controls.
    // Orders now stay in 'restaurant_received' until restaurant explicitly clicks Accept.
    // Restaurant → Accept → Preparing → Ready → Rider receives → Pickup → Deliver
    // this.startRiderSimulator(deliveryId, orderData, pickupLat, pickupLng, deliveryLat, deliveryLng, etaMinutes);

    return {
      success: true,
      deliveryId,
      orderId,
      provider: 'scrollnom',
      status: 'restaurant_received',
      rider,
      pickupLocation: DEFAULT_RESTAURANT_LOCATION,
      deliveryLocation: DEFAULT_CUSTOMER_LOCATION,
      etaMinutes
    };
  }

  // Log audit event to delivery_events table
  async logEvent(deliveryId, eventType, latitude, longitude, metadata = {}) {
    const eventId = `de_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    await dbRun(`
      INSERT INTO delivery_events (id, delivery_id, event_type, latitude, longitude, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [eventId, deliveryId, eventType, latitude, longitude, JSON.stringify(metadata)]);
  }

  // Get Current Delivery Status
  async getDeliveryStatus(deliveryId) {
    const record = await dbGet('SELECT * FROM deliveries WHERE id = ?', [deliveryId]);
    if (!record) throw new Error(`Delivery ${deliveryId} not found.`);
    return record;
  }

  // Get Detailed Real-time Tracking Data
  async getTracking(deliveryId) {
    const record = await dbGet('SELECT * FROM deliveries WHERE id = ?', [deliveryId]);
    if (!record) throw new Error(`Delivery ${deliveryId} not found.`);

    const events = await dbGet('SELECT * FROM delivery_events WHERE delivery_id = ? ORDER BY created_at DESC LIMIT 10', [deliveryId]);

    return {
      deliveryId: record.id,
      orderId: record.order_id,
      provider: record.provider,
      status: record.status,
      etaMinutes: record.eta_minutes,
      rider: {
        id: record.rider_id,
        name: record.rider_name,
        phoneMasked: record.rider_phone_masked,
        location: {
          latitude: record.rider_lat,
          longitude: record.rider_lng
        }
      },
      pickupLocation: {
        latitude: record.pickup_lat,
        longitude: record.pickup_lng,
        name: DEFAULT_RESTAURANT_LOCATION.name
      },
      deliveryLocation: {
        latitude: record.delivery_lat,
        longitude: record.delivery_lng,
        address: DEFAULT_CUSTOMER_LOCATION.address
      },
      lastUpdated: record.updated_at
    };
  }

  // Cancel Delivery
  async cancelDelivery(deliveryId, reason) {
    await dbRun('UPDATE deliveries SET status = "cancelled", updated_at = CURRENT_TIMESTAMP WHERE id = ?', [deliveryId]);
    await this.logEvent(deliveryId, 'cancelled', null, null, { reason });
    return { success: true, status: 'cancelled' };
  }

  // Handle Webhooks
  async handleWebhook(headers, payload) {
    return { received: true, provider: 'scrollnom' };
  }

  // Development Rider Simulator Loop
  startRiderSimulator(deliveryId, orderData, pickupLat, pickupLng, deliveryLat, deliveryLng, initialEta) {
    console.log(`[RIDER SIMULATOR] Started live simulation sequence for delivery:${deliveryId}`);

    const steps = [
      { delay: 1500, status: 'accepted', message: 'Restaurant accepted your order!' },
      { delay: 3500, status: 'preparing', message: 'Chef is preparing your fresh meal 🍳' },
      { delay: 6000, status: 'ready_for_pickup', message: 'Order is packed and ready for pickup 📦' },
      { delay: 8000, status: 'rider_assigned', message: 'Rider Vikram Singh assigned to pick up your order 🚴' },
      { delay: 10500, status: 'picked_up', message: 'Rider picked up food from restaurant 🛍️' },
      { delay: 12500, status: 'out_for_delivery', progress: 0.25, message: 'Rider is on the way (25% complete) 🛵' },
      { delay: 15000, status: 'out_for_delivery', progress: 0.50, message: 'Rider is halfway to your location 📍' },
      { delay: 17500, status: 'out_for_delivery', progress: 0.75, message: 'Rider is entering your neighborhood 🏁' },
      { delay: 20000, status: 'delivered', progress: 1.0, message: 'Order delivered successfully! Enjoy your meal 🎉' }
    ];

    steps.forEach(step => {
      setTimeout(async () => {
        try {
          const current = await dbGet('SELECT * FROM deliveries WHERE id = ?', [deliveryId]);
          if (!current || current.status === 'cancelled') return;

          let newLat = current.rider_lat;
          let newLng = current.rider_lng;
          let newEta = current.eta_minutes;

          if (step.progress !== undefined) {
            const interpolated = interpolateLocation(pickupLat, pickupLng, deliveryLat, deliveryLng, step.progress);
            newLat = interpolated.latitude;
            newLng = interpolated.longitude;
            newEta = Math.max(0, Math.round(initialEta * (1 - step.progress)));
          }

          // Update SQLite Database record
          await dbRun(`
            UPDATE deliveries
            SET status = ?, rider_lat = ?, rider_lng = ?, eta_minutes = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `, [step.status, newLat, newLng, newEta, deliveryId]);

          // Log Audit Event
          await this.logEvent(deliveryId, step.status, newLat, newLng, { message: step.message });

          // Broadcast Realtime SSE Event to Subscribed Clients
          const updatePayload = {
            deliveryId,
            orderId: orderData.orderId,
            provider: 'scrollnom',
            status: step.status,
            message: step.message,
            etaMinutes: newEta,
            rider: {
              id: current.rider_id,
              name: current.rider_name,
              phoneMasked: current.rider_phone_masked,
              location: { latitude: newLat, longitude: newLng }
            },
            pickupLocation: { latitude: pickupLat, longitude: pickupLng },
            deliveryLocation: { latitude: deliveryLat, longitude: deliveryLng }
          };

          trackingService.broadcast(deliveryId, updatePayload);

          console.log(`[RIDER SIMULATOR] Delivery ${deliveryId} -> ${step.status} (${step.message})`);

        } catch (err) {
          console.error(`[RIDER SIMULATOR ERROR] Failed to advance step for ${deliveryId}`, err);
        }
      }, step.delay);
    });
  }
}

export const scrollnomAdapter = new ScrollNomAdapter();
