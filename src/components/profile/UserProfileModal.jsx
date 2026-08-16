import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { API_BASE } from '../../config/api';
import { X, UserPlus, UserCheck, ShieldCheck, Sparkles, Award } from 'lucide-react';

export const UserProfileModal = ({ username, isOpen, onClose }) => {
  const { user, getAuthToken, showToast } = useApp();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !username) return;

    let isMounted = true;
    setLoading(true);

    const fetchProfile = async () => {
      try {
        const token = await getAuthToken();
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const res = await fetch(`${API_BASE}/users/profile/${username}`, { headers });
        if (res.ok) {
          const json = await res.json();
          if (isMounted) setProfile(json.data);
        }
      } catch (e) {
        console.error('[PROFILE FETCH ERROR]', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProfile();
    return () => { isMounted = false; };
  }, [isOpen, username]);

  if (!isOpen) return null;

  const handleToggleFollow = async () => {
    if (!user.isLoggedIn) {
      showToast('Please sign in to follow users!', 'info');
      return;
    }
    if (!profile || profile.isSelf) return;

    // Optimistic UI state update
    const previousIsFollowing = profile.isFollowing;
    const previousCount = profile.followerCount;

    setProfile(prev => ({
      ...prev,
      isFollowing: !previousIsFollowing,
      followerCount: previousIsFollowing ? previousCount - 1 : previousCount + 1
    }));

    setFollowLoading(true);

    try {
      const token = await getAuthToken();
      const method = previousIsFollowing ? 'DELETE' : 'POST';
      const res = await fetch(`${API_BASE}/users/${profile.id}/follow`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const json = await res.json();
        showToast(
          previousIsFollowing ? `Unfollowed @${profile.username}` : `Now following @${profile.username}! 🎉`,
          'success'
        );
        setProfile(prev => ({
          ...prev,
          isFollowing: json.data.isFollowing,
          followerCount: json.data.followerCount
        }));
      } else {
        // Revert on error
        setProfile(prev => ({
          ...prev,
          isFollowing: previousIsFollowing,
          followerCount: previousCount
        }));
        showToast('Failed to update follow status.', 'error');
      }
    } catch (e) {
      setProfile(prev => ({
        ...prev,
        isFollowing: previousIsFollowing,
        followerCount: previousCount
      }));
      showToast('Network error while updating follow.', 'error');
    } finally {
      setFollowLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-modal border border-warm-grey relative animate-scale-up">
        {/* Header Scrim */}
        <div className="h-28 bg-gradient-to-r from-brand-coral via-brand-coral-hover to-brand-teal p-4 relative flex justify-between items-start">
          <span className="text-[10px] uppercase font-bold tracking-widest text-white/90 bg-black/20 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/20">
            ScrollNom Profile
          </span>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Card Body */}
        <div className="px-6 pb-6 pt-0 relative space-y-4">
          {/* Avatar Overflow */}
          <div className="flex justify-between items-end -mt-12 mb-2">
            <div className="relative">
              <img
                src={profile?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt={profile?.displayName || 'User'}
                className="w-24 h-24 rounded-full border-4 border-white shadow-md object-cover bg-white"
              />
              {profile?.isCreator && (
                <div className="absolute bottom-0 right-0 bg-brand-coral text-white p-1 rounded-full border-2 border-white shadow-sm" title="ScrollNom Creator">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
              )}
            </div>

            {/* Follow / Edit Button */}
            {!loading && profile && (
              <div>
                {profile.isSelf ? (
                  <span className="text-xs font-semibold text-charcoal-muted bg-cream-bg px-3 py-1.5 rounded-full border border-warm-grey">
                    Your Profile
                  </span>
                ) : (
                  <button
                    onClick={handleToggleFollow}
                    disabled={followLoading}
                    className={`px-5 py-2 rounded-xl text-sm font-bold shadow-button transition-all flex items-center space-x-1.5 ${
                      profile.isFollowing
                        ? 'bg-cream-dark text-charcoal hover:bg-red-50 hover:text-red-600 hover:border-red-200 border border-warm-grey'
                        : 'bg-brand-coral text-white hover:bg-brand-coral-hover'
                    }`}
                  >
                    {profile.isFollowing ? (
                      <>
                        <UserCheck className="w-4 h-4 text-brand-teal" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Follow</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>

          {loading ? (
            <div className="py-8 text-center text-charcoal-muted text-sm animate-pulse">
              Loading ScrollNom profile...
            </div>
          ) : profile ? (
            <div className="space-y-4">
              <div>
                <div className="flex items-center space-x-1.5">
                  <h3 className="text-xl font-bold font-heading text-charcoal">{profile.displayName}</h3>
                  {profile.isCreator && (
                    <span className="bg-brand-coral/10 text-brand-coral text-[10px] font-bold px-2 py-0.5 rounded-full">
                      CREATOR
                    </span>
                  )}
                </div>
                <p className="text-xs text-brand-teal font-medium">@{profile.username}</p>
              </div>

              {profile.bio && (
                <p className="text-xs text-charcoal-muted bg-cream-bg p-3 rounded-xl border border-warm-grey/60">
                  {profile.bio}
                </p>
              )}

              {/* Stats Bar */}
              <div className="grid grid-cols-2 gap-3 bg-cream-bg p-3 rounded-2xl border border-warm-grey text-center">
                <div>
                  <p className="text-lg font-bold text-brand-coral">{profile.followerCount}</p>
                  <p className="text-[11px] font-semibold text-charcoal-muted uppercase tracking-wider">Followers</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-brand-teal">{profile.followingCount}</p>
                  <p className="text-[11px] font-semibold text-charcoal-muted uppercase tracking-wider">Following</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-charcoal-muted text-sm">
              User profile could not be loaded.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
