// ScrollNom Backend API & Razorpay TEST MODE Integration Service
import { API_BASE } from '../config/api';

export const triggerRazorpayCheckout = async ({ amount, user, cartItems, items, foodOnFriend, authToken, description, onSuccess, onFailure }) => {
  try {
    const bearerToken = authToken || (user?.firebaseUid ? `fb_token_${user.firebaseUid}::${encodeURIComponent(user?.email || 'customer@scrollnom.com')}` : null);
    const authHeaders = {
      'Content-Type': 'application/json',
      ...(bearerToken ? { 'Authorization': `Bearer ${bearerToken}` } : {})
    };

    const orderItems = items || cartItems;

    // 1. Request server to validate order & create Razorpay TEST order with verified Firebase Auth
    const orderResponse = await fetch(`${API_BASE}/payments/create-order`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        items: orderItems || [{ dishId: 'd1', title: 'Hyderabadi Dum Biryani', price: amount, quantity: 1 }],
        foodOnFriend
      })
    });

    let orderData;
    if (orderResponse.ok) {
      const resJson = await orderResponse.json();
      orderData = resJson.data;
    } else {
      console.warn('[PAYMENT API] Server order endpoint returned non-200. Using test mode fallback.');
      orderData = {
        orderId: `ORD-${Date.now()}`,
        razorpayOrderId: `order_mock_${Date.now()}`,
        amount,
        currency: 'INR',
        keyId: 'rzp_test_TPLSuyqxKXDmNn'
      };
    }

    const options = {
      key: orderData.keyId || 'rzp_test_TPLSuyqxKXDmNn',
      amount: (orderData.amount || amount) * 100, // Amount in paise
      currency: orderData.currency || 'INR',
      name: 'ScrollNom Food Delivery (TEST MODE)',
      description: description || `Order ${orderData.orderId} [TEST MODE]`,
      order_id: orderData.razorpayOrderId?.startsWith('order_mock') ? undefined : orderData.razorpayOrderId,
      prefill: {
        name: user?.name || 'ScrollNom Customer',
        email: user?.email || 'customer@scrollnom.com',
        contact: user?.phone || '+91 98765 43210'
      },
      theme: {
        color: '#FF5A36'
      },
      handler: async function (response) {
        // 2. Send REAL Razorpay payment response to backend for HMAC-SHA256 signature verification
        try {
          if (!response.razorpay_payment_id || !response.razorpay_signature) {
            console.error('[PAYMENT HANDLER] Missing payment_id or signature from Razorpay response');
            if (onFailure) onFailure(new Error('Incomplete payment response from Razorpay'));
            return;
          }

          const verifyResponse = await fetch(`${API_BASE}/payments/verify`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
              orderId: orderData.orderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })
          });

          if (verifyResponse.ok) {
            const verifyData = await verifyResponse.json();
            if (onSuccess) onSuccess(verifyData.data || { paymentId: response.razorpay_payment_id, orderId: orderData.orderId, deliveryId: verifyData.data?.deliveryId });
          } else {
            const errBody = await verifyResponse.json().catch(() => ({}));
            console.error('[PAYMENT VERIFICATION FAILED]', verifyResponse.status, errBody);
            if (onFailure) onFailure(new Error(errBody.error?.message || 'Payment verification failed on server'));
          }
        } catch (e) {
          console.error('[VERIFY ERROR] Payment verification network error:', e);
          if (onFailure) onFailure(new Error('Payment verification request failed. Please check your connection.'));
        }
      }
    };

    // Open Razorpay Checkout modal — SDK MUST be loaded via index.html script tag
    if (window.Razorpay) {
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (failedResponse) {
        console.error('[RAZORPAY PAYMENT FAILED]', failedResponse.error?.code, failedResponse.error?.description);
        if (onFailure) onFailure(new Error(failedResponse.error?.description || 'Payment failed'));
      });
      rzp.open();
    } else {
      console.error('[RAZORPAY SDK MISSING] https://checkout.razorpay.com/v1/checkout.js is not loaded. Cannot open checkout.');
      if (onFailure) onFailure(new Error('Razorpay checkout SDK not loaded. Please refresh the page and try again.'));
    }
  } catch (err) {
    console.error('[CHECKOUT ERROR]', err);
    if (onFailure) onFailure(err);
  }
};
