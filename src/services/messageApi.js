import { API_BASE } from '../config/api';

export const fetchConversations = async (token) => {
  const res = await fetch(`${API_BASE}/messages/conversations`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch conversations.');
  const json = await res.json();
  return json.data || [];
};

export const fetchMessages = async (token, conversationId) => {
  const res = await fetch(`${API_BASE}/messages/conversations/${conversationId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch messages.');
  const json = await res.json();
  return json.data || [];
};

export const sendDirectMessage = async (token, recipientId, body) => {
  const res = await fetch(`${API_BASE}/messages/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ recipientId, body })
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.error?.message || 'Failed to send message.');
  }
  const json = await res.json();
  return json.data;
};

export const createOrGetConversation = async (token, targetUserId) => {
  const res = await fetch(`${API_BASE}/messages/conversations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ targetUserId })
  });
  if (!res.ok) throw new Error('Failed to create or fetch conversation.');
  const json = await res.json();
  return json.data;
};

export const markConversationRead = async (token, conversationId) => {
  const res = await fetch(`${API_BASE}/messages/read/${conversationId}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to mark conversation read.');
  const json = await res.json();
  return json.data;
};

export const fetchUnreadMessageCount = async (token) => {
  const res = await fetch(`${API_BASE}/messages/unread-count`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) return 0;
  const json = await res.json();
  return json.data?.unreadCount || 0;
};
