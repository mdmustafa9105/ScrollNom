import { deliveryService } from '../modules/delivery/deliveryService.js';
import { trackingService } from '../modules/delivery/tracking/trackingService.js';

export const getAdaptersStatus = async (req, res, next) => {
  try {
    const infos = deliveryService.getAdaptersInfo();
    res.json({
      success: true,
      developmentFlags: {
        SCROLLNOM_SIMULATED_DELIVERY: true,
        ZOMATO_NOT_CONNECTED: true,
        SWIGGY_NOT_CONNECTED: true,
        RAZORPAY_TEST_MODE: true
      },
      data: infos
    });
  } catch (error) {
    next(error);
  }
};

export const getTrackingData = async (req, res, next) => {
  try {
    const { deliveryId } = req.params;
    const userUid = req.user.uid;
    const tracking = await deliveryService.getTrackingInfo(deliveryId, userUid);
    res.json({ success: true, data: tracking });
  } catch (error) {
    next(error);
  }
};

export const streamDeliveryUpdates = (req, res) => {
  const { deliveryId } = req.params;

  // Set SSE Headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  // Send initial connection ACK
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', deliveryId, timestamp: new Date().toISOString() })}\n\n`);

  // Subscribe client to real-time channel
  trackingService.subscribe(deliveryId, res);
};

export const simulateDeliveryStep = async (req, res, next) => {
  try {
    const { deliveryId } = req.params;
    const tracking = await deliveryService.getTrackingInfo(deliveryId, req.user.uid);
    res.json({ success: true, message: 'Step simulation triggered.', data: tracking });
  } catch (error) {
    next(error);
  }
};
