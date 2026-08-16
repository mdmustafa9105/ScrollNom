import { dbGet } from '../db/database.js';

export const validateAndCalculateOrderAsync = async (items = []) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Order must contain at least one valid item.');
  }

  let subtotal = 0;
  const validatedItems = await Promise.all(items.map(async (item) => {
    const dishId = item.dishId || item.id;
    let price = Number(item.price);
    const quantity = Number(item.quantity) || 1;
    let title = item.title || item.name || 'ScrollNom Dish';
    let restaurantName = item.restaurantName || 'ScrollNom Partner';

    // Fetch canonical price from database if dishId exists
    if (dishId) {
      const canonicalItem = await dbGet('SELECT * FROM restaurant_menu_items WHERE id = ?', [dishId]);
      if (canonicalItem) {
        let canonicalPrice = canonicalItem.price;
        if (canonicalItem.discount_percent > 0) {
          canonicalPrice = Math.round(canonicalPrice * (1 - canonicalItem.discount_percent / 100));
        }
        price = canonicalPrice;
        title = canonicalItem.name;
      }
    }

    if (isNaN(price) || price <= 0) {
      throw new Error(`Invalid item price for ${title}`);
    }

    subtotal += price * quantity;
    return {
      dishId,
      title,
      name: title,
      price,
      quantity,
      restaurantName
    };
  }));

  const deliveryFee = subtotal > 0 ? 40 : 0;
  const taxes = Math.round(subtotal * 0.05);
  const totalAmount = subtotal + deliveryFee + taxes;

  return {
    items: validatedItems,
    subtotal,
    deliveryFee,
    taxes,
    totalAmount
  };
};

export const validateAndCalculateOrder = (items = []) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Order must contain at least one valid item.');
  }

  let subtotal = 0;
  const validatedItems = items.map(item => {
    const price = Number(item.price);
    const quantity = Number(item.quantity) || 1;
    
    if (isNaN(price) || price <= 0) {
      throw new Error(`Invalid item price for ${item.title || 'dish'}`);
    }

    subtotal += price * quantity;
    return {
      dishId: item.dishId || item.id,
      title: item.title || item.name || 'ScrollNom Dish',
      name: item.name || item.title || 'ScrollNom Dish',
      price,
      quantity,
      restaurantName: item.restaurantName || 'ScrollNom Partner'
    };
  });

  const deliveryFee = subtotal > 0 ? 40 : 0;
  const taxes = Math.round(subtotal * 0.05);
  const totalAmount = subtotal + deliveryFee + taxes;

  return {
    items: validatedItems,
    subtotal,
    deliveryFee,
    taxes,
    totalAmount
  };
};


import { db } from '../db/memoryStore.js';
import { dbRun } from '../db/database.js';

export const createOrderService = async (orderInput) => {
  const calculation = await validateAndCalculateOrderAsync(orderInput.items);

  const orderData = {
    userId: orderInput.userId || 'u1',
    items: calculation.items,
    restaurantName: calculation.items[0]?.restaurantName || 'ScrollNom Partner',
    subtotal: calculation.subtotal,
    deliveryFee: calculation.deliveryFee,
    taxes: calculation.taxes,
    amount: calculation.totalAmount, // Server-validated net amount
    foodOnFriend: orderInput.foodOnFriend || null
  };

  const order = db.createOrder(orderData);

  // Write persistent row to SQLite orders table
  await dbRun(`
    INSERT OR REPLACE INTO orders (
      order_id, user_id, items_json, restaurant_name, subtotal, delivery_fee, taxes, amount, amount_paise, currency, status, payment_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'INR', 'created', 'pending')
  `, [
    order.orderId, order.userId, JSON.stringify(order.items), order.restaurantName,
    order.subtotal, order.deliveryFee, order.taxes, order.amount, order.amountPaise
  ]).catch(err => console.error('[SQLITE ORDER INSERT ERROR]', err));

  return order;
};

