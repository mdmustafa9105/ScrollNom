import { BaseDeliveryAdapter } from '../deliveryAdapter.js';

export class SwiggyAdapter extends BaseDeliveryAdapter {
  constructor() {
    super('swiggy', false); // Status: NOT_CONNECTED (Missing Swiggy Direct API keys)
  }

  async createDelivery(orderData) {
    return {
      success: false,
      provider: 'swiggy',
      status: 'NOT_CONNECTED',
      message: 'Swiggy Direct Merchant API access is not configured. Approved credentials required.',
      requiredCredentials: ['SWIGGY_CLIENT_ID', 'SWIGGY_CLIENT_SECRET', 'SWIGGY_STORE_ID']
    };
  }

  async getDeliveryStatus(deliveryId) {
    return {
      deliveryId,
      provider: 'swiggy',
      status: 'NOT_CONNECTED',
      message: 'Swiggy API adapter in stub mode.'
    };
  }

  async getTracking(deliveryId) {
    return {
      deliveryId,
      provider: 'swiggy',
      status: 'NOT_CONNECTED',
      message: 'Swiggy tracking stub active.'
    };
  }

  async cancelDelivery(deliveryId, reason) {
    return {
      success: false,
      provider: 'swiggy',
      status: 'NOT_CONNECTED',
      message: 'Swiggy cancellation stub active.'
    };
  }

  async handleWebhook(headers, payload) {
    console.log('[SWIGGY WEBHOOK STUB] Ingested Swiggy event payload.');
    return {
      received: true,
      provider: 'swiggy',
      status: 'PROCESSED_STUB'
    };
  }
}
