import { API_BASE } from '../config/api';

export const fetchNotifications = async (token) => {
  const res = await fetch(`${API_BASE}/notifications`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch notifications.');
  const json = await res.json();
  return json.data || [];
};

export const fetchUnreadNotificationCount = async (token) => {
  const res = await fetch(`${API_BASE}/notifications/unread-count`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) return 0;
  const json = await res.json();
  return json.data?.unreadCount || 0;
};

export const markNotificationRead = async (token, notificationId) => {
  const res = await fetch(`${API_BASE}/notifications/${notificationId}/read`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to mark notification read.');
  const json = await res.json();
  return json.data;
};

export const markAllNotificationsRead = async (token) => {
  const res = await fetch(`${API_BASE}/notifications/read-all`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to mark all notifications read.');
  const json = await res.json();
  return json.data;
};
