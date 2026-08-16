import { dbGet, dbRun } from '../db/database.js';

export const recordViewEvent = async (userUid, contentId) => {
  const user = await dbGet('SELECT id FROM users WHERE firebase_uid = ?', [userUid]);
  const userId = user ? user.id : 'u1';
  const viewId = `v_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

  await dbRun('INSERT INTO content_views (id, user_id, content_id) VALUES (?, ?, ?)', [
    viewId, userId, contentId
  ]);

  return { success: true, viewId, contentId };
};

export const recordOrderIntent = async (userUid, contentId, dishId, restaurantName) => {
  const user = await dbGet('SELECT id FROM users WHERE firebase_uid = ?', [userUid]);
  const userId = user ? user.id : 'u1';
  const intentId = `oi_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

  await dbRun('INSERT INTO order_intents (id, user_id, content_id, dish_id, restaurant_name) VALUES (?, ?, ?, ?, ?)', [
    intentId, userId, contentId || null, dishId || 'd1', restaurantName || 'ScrollNom Partner'
  ]);

  console.log(`[ANALYTICS] Recorded Order Intent for User ${userId} on Dish ${dishId}`);

  return { success: true, intentId, dishId };
};

export const recordConfirmedOrder = async (userUid, orderId, paymentId, amount) => {
  const user = await dbGet('SELECT id FROM users WHERE firebase_uid = ?', [userUid]);
  const userId = user ? user.id : (userUid || 'u1');
  const confirmedId = `coi_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

  await dbRun('INSERT INTO confirmed_order_intents (id, user_id, order_id, razorpay_payment_id, amount) VALUES (?, ?, ?, ?, ?)', [
    confirmedId, userId, orderId, paymentId, amount
  ]);

  console.log(`[BEHAVIORAL ATTRIBUTION] Confirmed Payment Recorded: Order ${orderId}, Payment ${paymentId}, Amount ₹${amount}`);

  return { success: true, confirmedId, orderId };
};
