// Common Provider Adapter Interface Contract for ScrollNom Delivery Engine

export class BaseDeliveryAdapter {
  constructor(providerName, isConnected = false) {
    this.providerName = providerName;
    this.isConnected = isConnected;
  }

  async createDelivery(orderData) {
    throw new Error(`[${this.providerName}] createDelivery() not implemented.`);
  }

  async getDeliveryStatus(deliveryId) {
    throw new Error(`[${this.providerName}] getDeliveryStatus() not implemented.`);
  }

  async getTracking(deliveryId) {
    throw new Error(`[${this.providerName}] getTracking() not implemented.`);
  }

  async cancelDelivery(deliveryId, reason) {
    throw new Error(`[${this.providerName}] cancelDelivery() not implemented.`);
  }

  async handleWebhook(headers, payload) {
    throw new Error(`[${this.providerName}] handleWebhook() not implemented.`);
  }

  getAdapterInfo() {
    return {
      provider: this.providerName,
      status: this.isConnected ? 'ACTIVE' : 'NOT_CONNECTED',
      capabilities: {
        liveTracking: this.isConnected,
        riderAssignment: this.isConnected,
        webhookIngestion: true
      }
    };
  }
}
