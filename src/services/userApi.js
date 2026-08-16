const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Search user profiles by username or display name.
 * Calls GET /api/users/search?q=<query>
 */
export const searchUserProfiles = async (query, token) => {
  const res = await fetch(
    `${API_BASE}/api/users/search?q=${encodeURIComponent(query)}`,
    {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to search users.');
  }

  const json = await res.json();
  return json.data || [];
};
