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

async function runThreeLaptopE2ETest() {
  console.log('\n💻 --- RUNNING THREE-LAPTOP DEMONSTRATION E2E TEST SUITE --- 💻\n');
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
    const ts = Date.now().toString().slice(-6);

    // Sync Customer (Laptop 1)
    const cust_uid = `fb_uid_cust_${ts}`;
    const cust_email = `customer_${ts}@scrollnom.com`;
    const cust_token = `fb_token_${cust_uid}::${encodeURIComponent(cust_email)}`;
    await request('POST', '/users/sync', {}, { 'Authorization': `Bearer ${cust_token}` });

    // STEP 1: LAPTOP 1 (CUSTOMER) - Create Order & Pay via Razorpay TEST MODE
    const orderRes = await request('POST', '/orders', {
      items: [{ id: 'd1', title: 'Hyderabadi Dum Biryani', price: 380, quantity: 1, restaurantName: 'Paradise Biryani Palace' }]
    }, { 'Authorization': `Bearer ${cust_token}` });
    assert(orderRes.status === 200 || orderRes.status === 201, 'LAPTOP 1: Customer creates food order');
    const order = orderRes.data.data;

    const verifyRes = await request('POST', '/payments/verify', {
      orderId: order.orderId,
      razorpay_order_id: `rzp_ord_${ts}`,
      razorpay_payment_id: `pay_del_${ts}`,
      razorpay_signature: 'valid_mock_signature'
    }, { 'Authorization': `Bearer ${cust_token}` });
    assert(verifyRes.status === 200 && verifyRes.data.data.deliveryId !== null, 'LAPTOP 1: Razorpay TEST MODE payment verified & delivery created');
    const deliveryId = verifyRes.data.data.deliveryId;

    // STEP 2: LAPTOP 2 (RESTAURANT OPS) - Receives same order & accepts/prepares/ready
    const restOrdersRes = await request('GET', '/restaurant/orders');
    const orderList = restOrdersRes.data?.data || restOrdersRes.data || [];
    const foundOrder = Array.isArray(orderList) && orderList.find(o => o.deliveryId === deliveryId || o.orderId === order.orderId);
    assert(restOrdersRes.status === 200 && !!foundOrder, 'LAPTOP 2: Restaurant receives same order in kitchen display system');

    const acceptRes = await request('PATCH', `/delivery/${deliveryId}/status`, { status: 'accepted' });
    assert(acceptRes.status === 200 && acceptRes.data.data.status === 'accepted', 'LAPTOP 2: Restaurant clicks ACCEPT ORDER');

    const prepRes = await request('PATCH', `/delivery/${deliveryId}/status`, { status: 'preparing' });
    assert(prepRes.status === 200 && prepRes.data.data.status === 'preparing', 'LAPTOP 2: Restaurant clicks MARK PREPARING');

    const readyRes = await request('PATCH', `/delivery/${deliveryId}/status`, { status: 'ready_for_pickup' });
    assert(readyRes.status === 200 && readyRes.data.data.status === 'ready_for_pickup', 'LAPTOP 2: Restaurant clicks MARK READY FOR PICKUP');

    // STEP 3: LAPTOP 3 (DELIVERY RIDER) - Receives same job, accepts, picks up, steps GPS
    const riderJobsRes = await request('GET', '/rider/deliveries');
    assert(riderJobsRes.status === 200 && riderJobsRes.data.data.some(d => d.deliveryId === deliveryId || d.orderId === order.orderId), 'LAPTOP 3: Rider receives same delivery job in rider app');

    const assignRes = await request('PATCH', `/delivery/${deliveryId}/status`, { status: 'rider_assigned' });
    assert(assignRes.status === 200 && assignRes.data.data.status === 'rider_assigned', 'LAPTOP 3: Rider clicks ACCEPT DELIVERY');

    const pickupRes = await request('PATCH', `/delivery/${deliveryId}/status`, { status: 'picked_up' });
    assert(pickupRes.status === 200 && pickupRes.data.data.status === 'picked_up', 'LAPTOP 3: Rider clicks CONFIRM PICKUP');

    // Rider updates GPS position
    const gpsRes = await request('PATCH', `/delivery/${deliveryId}/status`, {
      status: 'out_for_delivery',
      latitude: 17.4410,
      longitude: 78.4680,
      message: 'Rider moving along Banjara Hills route'
    });
    assert(gpsRes.status === 200 && gpsRes.data.data.rider_lat === 17.4410, 'LAPTOP 3: Rider steps GPS location (17.4410, 78.4680)');

    // STEP 4: LAPTOP 1 (CUSTOMER) - Checks live tracking telemetry
    const custTrackingRes = await request('GET', `/delivery/${deliveryId}/tracking`, {}, { 'Authorization': `Bearer ${cust_token}` });
    assert(custTrackingRes.status === 200 && custTrackingRes.data.data.rider.location.latitude === 17.4410, 'LAPTOP 1: Customer sees live moving rider position on map in real time');

    // STEP 5: LAPTOP 3 (DELIVERY RIDER) - Marks delivered
    const deliveredRes = await request('PATCH', `/delivery/${deliveryId}/status`, { status: 'delivered' });
    assert(deliveredRes.status === 200 && deliveredRes.data.data.status === 'delivered', 'LAPTOP 3: Rider clicks MARK DELIVERED');

    // STEP 6: LAPTOP 1 & 2 - Verify delivered completion
    const finalCustTracking = await request('GET', `/delivery/${deliveryId}/tracking`, {}, { 'Authorization': `Bearer ${cust_token}` });
    assert(finalCustTracking.data.data.status === 'delivered', 'LAPTOP 1: Customer app updates to DELIVERED status');

    console.log(`\n==================================================`);
    console.log(`📊 THREE-LAPTOP DEMO TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log(`==================================================\n`);

    if (failed > 0) process.exit(1);

  } catch (err) {
    console.error('Three-Laptop Demo E2E Test error:', err);
    process.exit(1);
  }
}

runThreeLaptopE2ETest();
