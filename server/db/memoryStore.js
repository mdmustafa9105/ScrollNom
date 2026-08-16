// Extensible In-Memory Store for ScrollNom Backend Development

class MemoryStore {
  constructor() {
    this.users = new Map();
    this.orders = new Map();
    this.foodOnFriendRequests = new Map();
    this.webhookEvents = [];

    // Seed demo user
    this.users.set('u_demo', {
      id: 'u_demo',
      name: 'ScrollNom Demo User',
      phone: '+91 98765 43210',
      email: 'demo@scrollnom.com',
      isLoggedIn: true,
      isCreator: false,
      address: {
        label: 'Home',
        street: 'Flat 402, Royal Palms, Jubilee Hills',
        area: 'Hyderabad, Telangana',
        pincode: '500033'
      }
    });
  }

  // --- USER METHODS ---
  getUser(id = null) {
    if (!id) return null;
    return this.users.get(id) || null;
  }

  // --- ORDER METHODS ---
  createOrder(orderData) {
    const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const order = {
      orderId,
      userId: orderData.userId || 'u1',
      items: orderData.items || [],
      restaurantName: orderData.restaurantName || 'ScrollNom Partner',
      subtotal: orderData.subtotal,
      deliveryFee: orderData.deliveryFee,
      taxes: orderData.taxes,
      amount: orderData.amount, // in INR
      amountPaise: Math.round(orderData.amount * 100), // in Paise for Razorpay
      currency: 'INR',
      status: 'created', // created | payment_pending | paid | confirmed | preparing | completed | cancelled | refunded
      paymentStatus: 'pending', // pending | paid | failed
      razorpayOrderId: null,
      razorpayPaymentId: null,
      foodOnFriend: orderData.foodOnFriend || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.orders.set(orderId, order);
    return order;
  }

  getOrder(orderId) {
    return this.orders.get(orderId) || null;
  }

  updateOrder(orderId, updates) {
    const order = this.orders.get(orderId);
    if (!order) return null;

    const updated = {
      ...order,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.orders.set(orderId, updated);
    return updated;
  }

  // --- FOOD ON FRIEND METHODS ---
  createFoodOnFriendRequest(data) {
    const requestId = `FOF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const request = {
      requestId,
      organizerId: data.organizerId,
      friendName: data.friendName || 'Friend',
      friendEmail: data.friendEmail || '',
      orderId: data.orderId || null,
      totalAmount: data.totalAmount,
      organizerContribution: data.organizerContribution,
      requestedContribution: data.requestedContribution,
      status: 'requested', // created | requested | accepted | declined | expired | covered_by_organizer | cancelled
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 mins expiry
    };

    this.foodOnFriendRequests.set(requestId, request);
    return request;
  }

  getFoodOnFriendRequest(requestId) {
    return this.foodOnFriendRequests.get(requestId) || null;
  }

  updateFoodOnFriendStatus(requestId, status, additionalData = {}) {
    const request = this.foodOnFriendRequests.get(requestId);
    if (!request) return null;

    const updated = {
      ...request,
      status,
      ...additionalData,
      updatedAt: new Date().toISOString()
    };

    this.foodOnFriendRequests.set(requestId, updated);
    return updated;
  }

  // --- WEBHOOK METHODS ---
  logWebhookEvent(event) {
    const entry = {
      id: `wh_${Date.now()}`,
      event: event.event,
      payload: event,
      receivedAt: new Date().toISOString()
    };
    this.webhookEvents.push(entry);
    return entry;
  }
}

export const db = new MemoryStore();
