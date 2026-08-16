import { dbAll, dbGet, dbRun } from '../db/database.js';
import { createNotification } from '../services/notificationService.js';

// POST /api/collaborations — Creator submits promotion request
export const createCollaborationRequest = async (req, res, next) => {
  try {
    const creatorUserId = req.user?.uid;
    if (!creatorUserId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required to submit promotion request.' }
      });
    }

    const { restaurantId, restaurantName, dishId, dishTitle, promotionType, message } = req.body;

    if (!restaurantId || !promotionType) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'restaurantId and promotionType are required.' }
      });
    }

    // Get creator details from SQLite users table or token
    const creatorUser = await dbGet('SELECT * FROM users WHERE firebase_uid = ? OR id = ?', [creatorUserId, creatorUserId]);
    const actualCreatorId = creatorUser?.id || creatorUserId;
    const creatorUsername = creatorUser?.username || req.user?.email?.split('@')[0] || 'creator';
    const creatorName = creatorUser?.display_name || req.user?.email?.split('@')[0] || 'Nommly Creator';
    const creatorAvatar = creatorUser?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

    const collabId = `collab_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    await dbRun(`
      INSERT INTO creator_collaborations (
        id, creator_user_id, creator_username, creator_name, creator_avatar,
        restaurant_id, restaurant_name, dish_id, dish_title, promotion_type, message, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `, [
      collabId, actualCreatorId, creatorUsername, creatorName, creatorAvatar,
      restaurantId, restaurantName || 'Paradise Biryani Palace', dishId || 'd1', dishTitle || 'Hyderabadi Dum Biryani',
      promotionType, message || 'Would love to review this dish on Nommly!'
    ]);

    const created = await dbGet('SELECT * FROM creator_collaborations WHERE id = ?', [collabId]);

    // Send CREATOR_COLLAB_REQUEST notification to restaurant owner / recipient
    try {
      const restUser = await dbGet('SELECT id FROM users WHERE id = ? OR username = ?', [`u_${restaurantId}`, restaurantId]);
      const restaurantUserId = restUser ? restUser.id : 'u_restaurant';

      await createNotification({
        recipientUserId: restaurantUserId,
        actorUserId: actualCreatorId,
        type: 'CREATOR_COLLAB_REQUEST',
        title: 'New Collaboration Request!',
        body: `@${creatorUsername} wants to promote ${restaurantName || 'your restaurant'}`,
        entityType: 'collaboration',
        entityId: collabId
      });
    } catch (e) {
      console.error('[COLLAB NOTIF ERROR]', e.message);
    }

    console.log(`[COLLABORATION] Creator @${creatorUsername} submitted request ${collabId} to Restaurant ${restaurantName}`);

    res.status(201).json({
      success: true,
      message: 'Promotion request submitted successfully.',
      data: created
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/creator/collaborations — Fetch creator's submitted collaborations
export const getCreatorCollaborations = async (req, res, next) => {
  try {
    const creatorUserId = req.user?.uid;
    if (!creatorUserId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required.' }
      });
    }

    const creatorUser = await dbGet('SELECT id FROM users WHERE firebase_uid = ? OR id = ?', [creatorUserId, creatorUserId]);
    const actualCreatorId = creatorUser?.id || creatorUserId;

    const rows = await dbAll(`
      SELECT * FROM creator_collaborations
      WHERE creator_user_id = ? OR creator_user_id = ?
      ORDER BY created_at DESC
    `, [actualCreatorId, creatorUserId]);

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/restaurant/collaborations — Fetch incoming requests for restaurant
export const getRestaurantCollaborations = async (req, res, next) => {
  try {
    const { restaurantId } = req.query;
    const targetRestId = restaurantId || 'r1'; // default demo restaurant

    const rows = await dbAll(`
      SELECT * FROM creator_collaborations
      WHERE restaurant_id = ? OR restaurant_id = 'r1'
      ORDER BY created_at DESC
    `, [targetRestId]);

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/restaurant/collaborations/:id/status — Restaurant Accept or Decline
export const updateCollaborationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'accepted' | 'declined'

    if (!['accepted', 'declined', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATUS', message: 'Status must be accepted, declined, completed, or cancelled.' }
      });
    }

    const collab = await dbGet('SELECT * FROM creator_collaborations WHERE id = ?', [id]);
    if (!collab) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Collaboration request ${id} not found.` }
      });
    }

    await dbRun(`
      UPDATE creator_collaborations
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [status, id]);

    const updated = await dbGet('SELECT * FROM creator_collaborations WHERE id = ?', [id]);

    // Send CREATOR_COLLAB_ACCEPTED or CREATOR_COLLAB_DECLINED notification to creator
    try {
      const notifType = status === 'accepted' ? 'CREATOR_COLLAB_ACCEPTED' : 'CREATOR_COLLAB_DECLINED';
      const notifTitle = status === 'accepted' ? 'Collab Request Accepted! 🎉' : 'Collab Request Declined';
      const notifBody = status === 'accepted'
        ? `${updated.restaurant_name} accepted your promotion request for ${updated.dish_title}.`
        : `${updated.restaurant_name} declined your promotion request.`;

      await createNotification({
        recipientUserId: updated.creator_user_id,
        actorUserId: 'u_restaurant',
        type: notifType,
        title: notifTitle,
        body: notifBody,
        entityType: 'collaboration',
        entityId: id
      });
    } catch (e) {
      console.error('[COLLAB STATUS NOTIF ERROR]', e.message);
    }

    console.log(`[COLLABORATION] Restaurant updated collaboration ${id} status to '${status}'`);

    res.json({
      success: true,
      message: `Collaboration request ${status}.`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};
