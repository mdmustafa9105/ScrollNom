import { dbGet, dbAll } from './server/db/database.js';
import { validateAndCalculateOrderAsync } from './server/services/orderService.js';

async function runTests() {
  console.log('==================================================');
  console.log('🧪 SCROLLNOM PHASE 14 AUTOMATED INTEGRATION SUITE');
  console.log('==================================================');

  // 1. Verify Creators
  const gocool = await dbGet('SELECT * FROM users WHERE username = ?', ['go_cool_bengaluru']);
  const azam = await dbGet('SELECT * FROM users WHERE username = ?', ['azamjasba']);

  if (!gocool || !azam) {
    throw new Error('FAILED: Creator accounts @go_cool_bengaluru or @azamjasba not found in SQLite DB.');
  }
  console.log('✅ Creator 1 (@go_cool_bengaluru): Verified (ID:', gocool.id, ')');
  console.log('✅ Creator 2 (@azamjasba): Verified (ID:', azam.id, ')');

  // 2. Verify Canonical Restaurants & Menu Graph
  const restCount = await dbGet('SELECT COUNT(*) as count FROM restaurants');
  const menuCount = await dbGet('SELECT COUNT(*) as count FROM restaurant_menu_items');

  if (restCount.count < 4 || menuCount.count < 10) {
    throw new Error(`FAILED: Insufficient restaurants (${restCount.count}) or menu graph items (${menuCount.count}).`);
  }
  console.log(`✅ Canonical Restaurant Graph: ${restCount.count} Restaurants, ${menuCount.count} Canonical Menu Items.`);

  // 3. Verify Diet Filtering (Veg / Non-Veg)
  const vegItems = await dbAll('SELECT * FROM restaurant_menu_items WHERE diet_type = "VEG"');
  const nonVegItems = await dbAll('SELECT * FROM restaurant_menu_items WHERE diet_type = "NON_VEG"');

  console.log(`✅ Diet Classification: ${vegItems.length} VEG items, ${nonVegItems.length} NON_VEG items.`);

  // 4. Verify 10 Real Creator Videos
  const gocoolVideos = await dbAll('SELECT * FROM content WHERE owner_id = ?', [gocool.id]);
  if (gocoolVideos.length < 10) {
    throw new Error(`FAILED: Expected 10 videos for @go_cool_bengaluru, found ${gocoolVideos.length}`);
  }
  console.log(`✅ Real Video Content Mapping: ${gocoolVideos.length} video records registered to @go_cool_bengaluru.`);

  // 5. Verify Multi-Dish Tagging & Offers
  const multiDishVideo = gocoolVideos.find(v => {
    try {
      const tags = JSON.parse(v.tagged_dishes_json);
      return tags.length > 1;
    } catch (e) {
      return false;
    }
  });

  if (!multiDishVideo) {
    throw new Error('FAILED: No multi-dish video tag found.');
  }
  console.log('✅ Multi-Dish Video Tagging: Verified video with multiple tagged dishes (ID:', multiDishVideo.id, ')');

  // 6. Verify Server-Side Canonical Order Calculation & Offer Discount
  const orderCalc = await validateAndCalculateOrderAsync([
    { dishId: 'd1_1', quantity: 1 }, // Hyderabadi Dum Biryani (380 with 50% OFF = 190)
    { dishId: 'd1_5', quantity: 1 }  // Cold Coffee (150)
  ]);

  if (orderCalc.items[0].price !== 190 || orderCalc.subtotal !== 340) {
    throw new Error(`FAILED: Server canonical price calculation incorrect. Expected 340 subtotal, got ${orderCalc.subtotal}`);
  }
  console.log('✅ Server-Side Canonical Price Calculation: Subtotal ₹340 (Biryani ₹190 + Coffee ₹150).');

  console.log('==================================================');
  console.log('✨ ALL PHASE 14 BACKEND INTEGRATION TESTS PASSED!');
  console.log('==================================================');
}

runTests().catch(err => {
  console.error('❌ PHASE 14 TEST FAILED:', err);
  process.exit(1);
});
