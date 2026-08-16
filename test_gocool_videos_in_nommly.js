async function verifyGocoolInNommly() {
  console.log('==================================================');
  console.log('🧪 VERIFYING GO_COOL_BENGALURU VIDEOS IN NOMMLY FEED');
  console.log('==================================================');

  // 1. Fetch /api/content/nommly
  const feedRes = await fetch('http://localhost:5000/api/content/nommly');
  if (!feedRes.ok) {
    throw new Error(`FAILED: /api/content/nommly returned status ${feedRes.status}`);
  }
  const feedData = await feedRes.json();
  const feedItems = feedData.data || [];
  console.log(`✅ Total Feed Items from /api/content/nommly: ${feedItems.length}`);

  const gocoolItems = feedItems.filter(i => i.creatorHandle === '@go_cool_bengaluru' || i.ownerUsername === 'go_cool_bengaluru');
  console.log(`✅ @go_cool_bengaluru Feed Items Count: ${gocoolItems.length} / 10`);

  if (gocoolItems.length < 10) {
    throw new Error(`FAILED: Expected 10 videos for @go_cool_bengaluru in Nommly feed, found ${gocoolItems.length}`);
  }

  // 2. Verify media URL accessibility for each of the 10 videos
  for (const item of gocoolItems) {
    const fullUrl = item.videoUrl.startsWith('http') ? item.videoUrl : `http://localhost:5000${item.videoUrl}`;
    const mediaRes = await fetch(fullUrl, { method: 'HEAD' });
    if (mediaRes.status !== 200) {
      throw new Error(`FAILED: Media URL for video ${item.id} (${fullUrl}) returned HTTP ${mediaRes.status}`);
    }
    console.log(`  • [${item.id}] "${item.title}" -> ${item.videoUrl} (HTTP 200, ₹${item.dishPrice}, ${item.restaurantName})`);
  }

  // 3. Verify creator profile endpoint
  const creatorRes = await fetch('http://localhost:5000/api/content/creator/go_cool_bengaluru');
  if (!creatorRes.ok) {
    throw new Error(`FAILED: /api/content/creator/go_cool_bengaluru returned HTTP ${creatorRes.status}`);
  }
  const creatorData = await creatorRes.json();
  console.log(`✅ Creator Profile Endpoint Videos Count: ${creatorData.data ? creatorData.data.length : 0} / 10`);

  console.log('==================================================');
  console.log('✨ ALL 10 GO_COOL_BENGALURU VIDEOS VERIFIED SUCCESSFULLY!');
  console.log('==================================================');
}

verifyGocoolInNommly().catch(err => {
  console.error(err);
  process.exit(1);
});
