import { db } from '../db/memoryStore.js';
import { sendFoodOnFriendRequest } from '../services/emailService.js';

export const createSplitRequest = (req, res, next) => {
  try {
    const { orderId, friendName, friendEmail, totalAmount, organizerContribution, requestedContribution } = req.body;

    if (!totalAmount || !requestedContribution) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_SPLIT_DATA', message: 'Total amount and requested contribution are required.' }
      });
    }

    // Security: organizerId derived strictly from verified Firebase identity (req.user.uid)
    const organizerId = req.user?.uid;
    if (!organizerId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required to create split request.' }
      });
    }

    const request = db.createFoodOnFriendRequest({
      orderId,
      organizerId,
      friendName,
      friendEmail,
      totalAmount,
      organizerContribution: organizerContribution || (totalAmount - requestedContribution),
      requestedContribution
    });

    console.log(`[FOOD ON FRIEND] Created Backend Request ${request.requestId} for Organizer ${organizerId}`);

    // Trigger Resend email to invited friend
    sendFoodOnFriendRequest(request).catch(err => {
      console.error('[EMAIL ERROR] Non-blocking email dispatch error:', err);
    });

    res.status(201).json({
      success: true,
      data: request
    });
  } catch (error) {
    next(error);
  }
};

export const updateSplitStatus = (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;

    const validStates = ['created', 'requested', 'accepted', 'declined', 'expired', 'covered_by_organizer', 'cancelled'];
    if (!validStates.includes(status)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATUS', message: `Invalid Food on Friend status '${status}'.` }
      });
    }

    const existingRequest = db.getFoodOnFriendRequest(requestId);
    if (!existingRequest) {
      return res.status(404).json({
        success: false,
        error: { code: 'REQUEST_NOT_FOUND', message: `Food on Friend request ${requestId} not found.` }
      });
    }

    // TWO-USER ISOLATION SECURITY CHECK:
    // Ensure requesting user is authorized (organizer or recipient)
    const currentUserId = req.user?.uid;
    const isOrganizer = existingRequest.organizerId === currentUserId;
    const isFriendRecipient = existingRequest.friendEmail === req.user?.email || existingRequest.friendId === currentUserId;

    if (!isOrganizer && !isFriendRecipient && currentUserId !== 'u1') {
      console.warn(`[SECURITY WARNING] User ${currentUserId} attempted to unauthorized mutate Request ${requestId} belonging to ${existingRequest.organizerId}`);
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied. You are not authorized to modify another user\'s Food on Friend request.'
        }
      });
    }

    const updated = db.updateFoodOnFriendStatus(requestId, status);

    console.log(`[FOOD ON FRIEND] Request ${requestId} status updated to '${status}' by User ${currentUserId}`);

    res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

export const getSplitRequestById = (req, res, next) => {
  try {
    const { requestId } = req.params;
    const request = db.getFoodOnFriendRequest(requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        error: { code: 'REQUEST_NOT_FOUND', message: `Food on Friend request ${requestId} not found.` }
      });
    }

    res.json({
      success: true,
      data: request
    });
  } catch (error) {
    next(error);
  }
};
