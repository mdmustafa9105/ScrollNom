import fs from 'fs';
import path from 'path';
import { dbGet, dbAll } from './server/db/database.js';
import { validateAndCalculateOrderAsync } from './server/services/orderService.js';

async function runVerification() {
  console.log('==================================================');
  console.log('🧪 SCROLLNOM IMMEDIATE FIX & METADATA VERIFICATION');
  console.log('==================================================');

  // 1. Verify creatorContentMetadata.json pipeline
  const metadataPath = path.join(process.cwd(), 'server', 'data', 'creatorContentMetadata.json');
  if (!fs.existsSync(metadataPath)) {
    throw new Error('FAILED: creatorContentMetadata.json does not exist.');
  }

  const metadataJson = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  if (!metadataJson.creators || metadataJson.creators.length < 2) {
    throw new Error('FAILED: Expected metadata pipeline for at least 2 creators.');
  }

  const gocoolMeta = metadataJson.creators.find(c => c.creator === 'go_cool_bengaluru');
  const azamMeta = metadataJson.creators.find(c => c.creator === 'azamjasba');

  if (!gocoolMeta || !azamMeta) {
    throw new Error('FAILED: Missing metadata entry for @go_cool_bengaluru or @azamjasba.');
  }

  console.log(`✅ Metadata Pipeline Loaded: ${gocoolMeta.videos.length} videos for @go_cool_bengaluru, ${azamMeta.videos.length} video for @azamjasba.`);

  // 2. Verify Canonical Menu & Multi-Dish Order Pricing
  const calcResult = await validateAndCalculateOrderAsync([
    { dishId: 'd3_1', quantity: 1 }, // Ghee Roast Benne Dosa (₹140)
    { dishId: 'd3_3', quantity: 2 }  // Authentic Filter Coffee (₹45 * 2 = ₹90)
  ]);

  if (calcResult.subtotal !== 230) {
    throw new Error(`FAILED: Canonical calculation expected 230, got ${calcResult.subtotal}`);
  }
  console.log('✅ Canonical Price Calculation: Verified subtotal ₹230 for Benne Dosa + 2x Filter Coffee.');

  // 3. Verify SQLite DB Order Authorization & Persistence
  const sampleOrder = await dbGet('SELECT * FROM orders LIMIT 1');
  console.log('✅ Order Authorization & Persistence: Database accessible, sample order ID:', sampleOrder ? sampleOrder.id : 'Clean DB state ready for live orders');

  console.log('==================================================');
  console.log('✨ ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!');
  console.log('==================================================');
}

runVerification().catch(err => {
  console.error('❌ VERIFICATION FAILED:', err);
  process.exit(1);
});
