// Real-time Delivery Streaming Service (SSE / WebSocket Broadcast Manager)

class TrackingService {
  constructor() {
    // Map of deliveryId -> Set of HTTP Response objects (SSE clients)
    this.subscribers = new Map();
  }

  // Register SSE Subscriber for deliveryId
  subscribe(deliveryId, res) {
    if (!this.subscribers.has(deliveryId)) {
      this.subscribers.set(deliveryId, new Set());
    }
    this.subscribers.get(deliveryId).add(res);
    console.log(`[REALTIME STREAM] Client subscribed to delivery channel: delivery:${deliveryId}`);

    // Remove subscriber on client disconnect
    res.on('close', () => {
      this.unsubscribe(deliveryId, res);
    });
  }

  // Remove Subscriber
  unsubscribe(deliveryId, res) {
    if (this.subscribers.has(deliveryId)) {
      const clients = this.subscribers.get(deliveryId);
      clients.delete(res);
      if (clients.size === 0) {
        this.subscribers.delete(deliveryId);
        console.log(`[REALTIME STREAM] Channel closed: delivery:${deliveryId}`);
      }
    }
  }

  // Broadcast Delivery Update Event to all subscribers of deliveryId
  broadcast(deliveryId, data) {
    if (!this.subscribers.has(deliveryId)) return;
    const clients = this.subscribers.get(deliveryId);
    const eventPayload = `data: ${JSON.stringify(data)}\n\n`;

    clients.forEach((res) => {
      try {
        res.write(eventPayload);
      } catch (err) {
        console.error(`[STREAM WRITE ERROR] Failed to push update to client for delivery:${deliveryId}`, err);
        this.unsubscribe(deliveryId, res);
      }
    });

    // Close channel if delivery is completed or cancelled
    if (data.status === 'delivered' || data.status === 'cancelled') {
      setTimeout(() => {
        clients.forEach(res => {
          try { res.end(); } catch (e) {}
        });
        this.subscribers.delete(deliveryId);
        console.log(`[REALTIME STREAM] Delivery ${deliveryId} completed. Stream terminated.`);
      }, 1000);
    }
  }
}

export const trackingService = new TrackingService();
