// Restaurant Order Handling Service (Development Simulator Interface)
import { dbGet, dbRun } from '../../db/database.js';

export const getRestaurantDetails = async (restaurantIdOrName) => {
  return {
    restaurantId: 'rest_001',
    name: 'Paradise Biryani Palace',
    latitude: 17.4435,
    longitude: 78.4891,
    address: 'SD Road, Secunderabad, Hyderabad',
    openingHours: '11:00 AM - 11:30 PM',
    isServiceable: true,
    serviceRadiusKm: 12.0
  };
};

export const updateRestaurantOrderState = async (orderId, newStatus) => {
  await dbRun('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE order_id = ?', [newStatus, orderId]);
  return { success: true, orderId, status: newStatus };
};
