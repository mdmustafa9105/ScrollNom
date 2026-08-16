// Server-Sent Events (SSE) Hub for Realtime Messages & Notifications
const clients = new Map(); // userId -> Set of res objects

export const realtimeService = {
  subscribeUser(userId, res) {
    if (!clients.has(userId)) {
      clients.set(userId, new Set());
    }
    const userClients = clients.get(userId);
    userClients.add(res);

    console.log(`[REALTIME SSE] User ${userId} connected. Total connections for user: ${userClients.size}`);

    reqCleanupOnClose(res, () => {
      userClients.delete(res);
      if (userClients.size === 0) {
        clients.delete(userId);
      }
      console.log(`[REALTIME SSE] User ${userId} disconnected.`);
    });
  },

  sendToUser(userId, eventType, payload) {
    const userClients = clients.get(userId);
    if (!userClients || userClients.size === 0) return false;

    const dataString = `event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`;
    userClients.forEach(res => {
      try {
        res.write(dataString);
      } catch (e) {
        console.error(`[REALTIME SSE ERROR] Failed to push event to user ${userId}:`, e.message);
      }
    });
    return true;
  }
};

function reqCleanupOnClose(res, callback) {
  res.on('close', callback);
  res.on('finish', callback);
  res.on('error', callback);
}
