// ScrollNom Razorpay Checkout Service
// Uses MockRazorpayModal for visual checkout experience (no real API keys needed)
import { API_BASE } from '../config/api';

export const triggerRazorpayCheckout = async ({ amount, user, cartItems, items, foodOnFriend, authToken, description, onSuccess, onFailure, onShowModal }) => {
  try {
    const bearerToken = authToken || (user?.firebaseUid ? `fb_token_${user.firebaseUid}::${encodeURIComponent(user?.email || 'customer@scrollnom.com')}` : null);
    const authHeaders = {
      'Content-Type': 'application/json',
      ...(bearerToken ? { 'Authorization': `Bearer ${bearerToken}` } : {})
    };

    const orderItems = items || cartItems;

    // 1. Request server to create order
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
      console.warn('[PAYMENT API] Server order endpoint returned non-200. Using fallback.');
      orderData = {
        orderId: `ORD-${Date.now()}`,
        razorpayOrderId: `order_mock_${Date.now()}`,
        amount,
        currency: 'INR',
        keyId: 'rzp_test_scrollnom_demo',
        isMock: true
      };
    }

    // 2. Show the MockRazorpayModal via callback
    if (onShowModal) {
      onShowModal({
        orderData,
        authHeaders,
        onPaymentDone: async (razorpayResponse) => {
          // 3. Verify payment on backend
          try {
            const verifyResponse = await fetch(`${API_BASE}/payments/verify`, {
              method: 'POST',
              headers: authHeaders,
              body: JSON.stringify({
                orderId: orderData.orderId,
                razorpay_order_id: razorpayResponse.razorpay_order_id,
                razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                razorpay_signature: razorpayResponse.razorpay_signature
              })
            });

            if (verifyResponse.ok) {
              const verifyData = await verifyResponse.json();
              if (onSuccess) onSuccess(verifyData.data || { paymentId: razorpayResponse.razorpay_payment_id, orderId: orderData.orderId, deliveryId: verifyData.data?.deliveryId });
            } else {
              const errBody = await verifyResponse.json().catch(() => ({}));
              console.error('[PAYMENT VERIFICATION FAILED]', verifyResponse.status, errBody);
              if (onFailure) onFailure(new Error(errBody.error?.message || 'Payment verification failed'));
            }
          } catch (e) {
            console.error('[VERIFY ERROR]', e);
            if (onFailure) onFailure(new Error('Payment verification request failed.'));
          }
        }
      });
    }
  } catch (err) {
    console.error('[CHECKOUT ERROR]', err);
    if (onFailure) onFailure(err);
  }
};
