import http from 'http';

const API_BASE = 'http://localhost:5000/api';

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const postData = body ? JSON.stringify(body) : '';
    
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (e) => reject(e));
    if (postData) req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('\n🧪 --- RUNNING BACKEND INDEPENDENT TEST SUITE --- 🧪\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Health Check
    const healthRes = await request('GET', '/health');
    assert(healthRes.status === 200 && healthRes.data.ok === true, 'GET /api/health returns ok: true');

    // 2. Invalid Cart Rejection
    const invalidCartRes = await request('POST', '/orders', { items: [] });
    assert(invalidCartRes.status === 400 && invalidCartRes.data.success === false, 'POST /api/orders rejects empty cart');

    // 3. Valid Order Creation
    const orderRes = await request('POST', '/orders', {
      userId: 'u1',
      items: [
        { dishId: 'd1', title: 'Hyderabadi Dum Biryani', price: 380, quantity: 2, restaurantName: 'Paradise Biryani Palace' }
      ]
    });
    assert(orderRes.status === 201 && orderRes.data.success === true, 'POST /api/orders creates valid order record');
    const createdOrder = orderRes.data.data;
    assert(createdOrder.amount === 380 * 2 + 40 + Math.round(380 * 2 * 0.05), 'Server calculates correct net total (subtotal + delivery + tax)');

    // 4. Create Razorpay Test Order
    const payOrderRes = await request('POST', '/payments/create-order', { orderId: createdOrder.orderId });
    assert(payOrderRes.status === 200 && payOrderRes.data.success === true, 'POST /api/payments/create-order generates Razorpay test order');
    const razorpayData = payOrderRes.data.data;
    assert(razorpayData.isTestMode === true, 'Razorpay order explicitly confirms isTestMode: true');

    // 5. Invalid Signature Rejection
    const invalidSigRes = await request('POST', '/payments/verify', {
      orderId: createdOrder.orderId,
      razorpay_order_id: razorpayData.razorpayOrderId,
      razorpay_payment_id: 'pay_test_123',
      razorpay_signature: 'invalid_forged_signature'
    });
    assert(invalidSigRes.status === 400 && invalidSigRes.data.success === false, 'POST /api/payments/verify rejects invalid payment signature');

    // 6. Valid Signature Payment Verification
    const validSigRes = await request('POST', '/payments/verify', {
      orderId: createdOrder.orderId,
      razorpay_order_id: razorpayData.razorpayOrderId,
      razorpay_payment_id: 'pay_test_999999',
      razorpay_signature: 'mock_sig_pay_test_999999'
    });
    assert(validSigRes.status === 200 && validSigRes.data.success === true, 'POST /api/payments/verify accepts valid payment signature');

    // 7. Verify Order Status Updated to Paid/Confirmed
    const getOrderRes = await request('GET', `/orders/${createdOrder.orderId}`);
    assert(getOrderRes.data.data.paymentStatus === 'paid' && getOrderRes.data.data.status === 'confirmed', 'Order status correctly updated to PAID & CONFIRMED');

    // 8. Food on Friend Request Creation
    const fofRes = await request('POST', '/food-on-friend/request', {
      orderId: createdOrder.orderId,
      friendName: 'Rohan',
      friendEmail: 'rohan@example.com',
      totalAmount: createdOrder.amount,
      organizerContribution: 400,
      requestedContribution: 438
    });
    assert(fofRes.status === 201 && fofRes.data.success === true, 'POST /api/food-on-friend/request creates backend split request');
    const fofData = fofRes.data.data;

    // 9. Food on Friend Status Transition (Decline)
    const declineRes = await request('PATCH', `/food-on-friend/${fofData.requestId}/status`, { status: 'declined' });
    assert(declineRes.status === 200 && declineRes.data.data.status === 'declined', 'PATCH /api/food-on-friend/:id/status updates state machine to declined');

    // 10. Food on Friend Status Transition (Covered by Organizer)
    const coverRes = await request('PATCH', `/food-on-friend/${fofData.requestId}/status`, { status: 'covered_by_organizer' });
    assert(coverRes.status === 200 && coverRes.data.data.status === 'covered_by_organizer', 'PATCH updates state machine to covered_by_organizer');

    // 11. Razorpay Webhook Signature Validation & Payment.captured Event
    const webhookRes = await request('POST', '/webhooks/razorpay', {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_wh_test_123',
            order_id: razorpayData.razorpayOrderId,
            amount: razorpayData.amountPaise,
            status: 'captured'
          }
        }
      }
    }, { 'x-razorpay-signature': 'mock_webhook_signature' });
    assert(webhookRes.status === 200 && webhookRes.data.status === 'ok', 'POST /api/webhooks/razorpay validates signature and processes payment.captured');

    console.log(`\n==================================================`);
    console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log(`==================================================\n`);

    if (failed > 0) process.exit(1);

  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTests();
