import { BaseDeliveryAdapter } from '../deliveryAdapter.js';

export class ZomatoAdapter extends BaseDeliveryAdapter {
  constructor() {
    super('zomato', false); // Status: NOT_CONNECTED (Missing enterprise API keys)
  }

  async createDelivery(orderData) {
    return {
      success: false,
      provider: 'zomato',
      status: 'NOT_CONNECTED',
      message: 'Zomato Enterprise Delivery API access is not configured. Approved merchant credentials required.',
      requiredCredentials: ['ZOMATO_MERCHANT_ID', 'ZOMATO_API_KEY', 'ZOMATO_WEBHOOK_SECRET']
    };
  }

  async getDeliveryStatus(deliveryId) {
    return {
      deliveryId,
      provider: 'zomato',
      status: 'NOT_CONNECTED',
      message: 'Zomato API adapter in stub mode.'
    };
  }

  async getTracking(deliveryId) {
    return {
      deliveryId,
      provider: 'zomato',
      status: 'NOT_CONNECTED',
      message: 'Zomato tracking stub active.'
    };
  }

  async cancelDelivery(deliveryId, reason) {
    return {
      success: false,
      provider: 'zomato',
      status: 'NOT_CONNECTED',
      message: 'Zomato order cancellation stub active.'
    };
  }

  async handleWebhook(headers, payload) {
    console.log('[ZOMATO WEBHOOK STUB] Ingested Zomato POS webhook event payload.');
    return {
      received: true,
      provider: 'zomato',
      status: 'PROCESSED_STUB'
    };
  }
}
