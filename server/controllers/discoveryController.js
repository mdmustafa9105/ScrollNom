import { getContextualNommlyFeed } from '../services/contextualRankingService.js';
import { getTimeBelt } from '../services/timeBeltService.js';
import { dbRun } from '../db/database.js';

// GET /api/discovery/nearby
export const handleGetNearbyDiscovery = async (req, res, next) => {
  try {
    const { hour, minute, isBrokenBelt, lat, lng } = req.query;
    const userUid = req.user?.uid || null;

    const parsedHour = hour !== undefined ? parseInt(hour, 10) : new Date().getHours();
    const parsedMinute = minute !== undefined ? parseInt(minute, 10) : new Date().getMinutes();
    const broken = isBrokenBelt === 'true' || isBrokenBelt === '1';
    const userLat = lat ? parseFloat(lat) : 12.9785;
    const userLng = lng ? parseFloat(lng) : 77.6402;

    const discoveryData = await getContextualNommlyFeed({
      hour: parsedHour,
      minute: parsedMinute,
      isBrokenBelt: broken,
      userLat,
      userLng,
      userUid
    });

    res.json({
      success: true,
      data: discoveryData
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/discovery/time-belt
export const handleGetTimeBeltInfo = async (req, res, next) => {
  try {
    const hour = req.query.hour ? parseInt(req.query.hour, 10) : new Date().getHours();
    const minute = req.query.minute ? parseInt(req.query.minute, 10) : new Date().getMinutes();
    const belt = getTimeBelt(hour, minute);
    res.json({ success: true, data: belt });
  } catch (error) {
    next(error);
  }
};

// POST /api/discovery/signals (Record behavioral signals: belt_viewed, broken_belt_activated, order_intent)
export const handleRecordDiscoverySignal = async (req, res, next) => {
  try {
    const userUid = req.user?.uid || 'guest';
    const { eventType, contentId, dishId, beltId, metadata } = req.body;

    if (!eventType) {
      return res.status(400).json({ success: false, error: 'eventType is required.' });
    }

    const signalId = `sig_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    await dbRun(`
      INSERT INTO delivery_events (id, delivery_id, event_type, metadata)
      VALUES (?, ?, ?, ?)
    `, [signalId, contentId || 'discovery_signal', eventType, JSON.stringify({ userUid, dishId, beltId, ...metadata })])
    .catch(() => {}); // Silent log if schema table differs

    res.json({
      success: true,
      data: { signalId, eventType, timestamp: new Date().toISOString() }
    });
  } catch (error) {
    next(error);
  }
};
