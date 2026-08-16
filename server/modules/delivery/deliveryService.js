import { scrollnomAdapter } from './providers/scrollnomAdapter.js';
import { ZomatoAdapter } from './providers/zomatoAdapter.js';
import { SwiggyAdapter } from './providers/swiggyAdapter.js';
import { dbGet } from '../../db/database.js';
import { db } from '../../db/memoryStore.js';

class DeliveryService {
  constructor() {
    this.adapters = new Map();

    // Register Provider Adapters
    this.adapters.set('scrollnom', scrollnomAdapter);
    this.adapters.set('zomato', new ZomatoAdapter());
    this.adapters.set('swiggy', new SwiggyAdapter());
  }

  // Get Registered Adapters Status
  getAdaptersInfo() {
    const infos = [];
    for (const [provider, adapter] of this.adapters.entries()) {
      infos.push(adapter.getAdapterInfo());
    }
    return infos;
  }

  // Create Delivery for Paid Order
  async createDeliveryForOrder(orderData, provider = 'scrollnom') {
    const adapter = this.adapters.get(provider.toLowerCase());
    if (!adapter) {
      throw new Error(`Delivery provider '${provider}' is not supported.`);
    }

    if (!adapter.isConnected) {
      throw new Error(`Delivery provider '${provider}' is NOT_CONNECTED. ScrollNom development provider is active.`);
    }

    console.log(`[DELIVERY SERVICE] Creating delivery for Order ${orderData.orderId} via Provider '${provider}'`);
    return await adapter.createDelivery(orderData);
  }

  // Get Real-time Tracking Info with Authorization Check
  async getTrackingInfo(deliveryId, userUid) {
    // 1. Fetch delivery record from SQLite
    const record = await dbGet('SELECT * FROM deliveries WHERE id = ?', [deliveryId]);
    if (!record) {
      const err = new Error(`Delivery ${deliveryId} not found.`);
      err.statusCode = 404;
      throw err;
    }

    // 2. Fetch associated order from memory store or SQLite to verify ownership
    const memoryOrder = db.getOrder ? db.getOrder(record.order_id) : null;
    const dbOrder = await dbGet('SELECT user_id FROM orders WHERE order_id = ?', [record.order_id]);
    const ownerId = memoryOrder?.userId || dbOrder?.user_id;

    if (ownerId && userUid && ownerId !== userUid) {
      const err = new Error('You are not authorized to view tracking data for this delivery.');
      err.statusCode = 403;
      throw err;
    }

    const adapter = this.adapters.get(record.provider);
    if (!adapter) throw new Error(`Provider '${record.provider}' adapter not registered.`);

    return await adapter.getTracking(deliveryId);
  }
}

export const deliveryService = new DeliveryService();
