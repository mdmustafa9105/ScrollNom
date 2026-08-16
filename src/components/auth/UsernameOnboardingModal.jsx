import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { API_BASE } from '../../config/api';
import { ScrollNomLogoIcon } from '../brand/IconSet';
import { CheckCircle2, XCircle, Sparkles, ArrowRight, User, Camera, SkipForward } from 'lucide-react';

const FOOD_AVATARS = [
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=150&auto=format&fit=crop&q=80'
];

export const UsernameOnboardingModal = ({ isOpen, onClose, onComplete }) => {
  const { user, setUser, getAuthToken, showToast } = useApp();
  
  // Step 1 = Username, Step 2 = Profile Completion
  const [step, setStep] = useState(1);

  // Username State
  const [usernameInput, setUsernameInput] = useState('');
  const [isAvailable, setIsAvailable] = useState(null);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Profile Completion State
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(FOOD_AVATARS[0]);

  // Reset & Auto-suggest on modal open
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      if (user?.email && !usernameInput) {
        const suggested = user.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
        setUsernameInput(suggested);
      }
      if (user?.name && !displayName) {
        setDisplayName(user.name);
      }
      if (user?.avatarUrl && !selectedAvatar) {
        setSelectedAvatar(user.avatarUrl);
      }
    }
  }, [isOpen]);

  // Debounced check username availability
  useEffect(() => {
    if (!isOpen || step !== 1) return;

    if (!usernameInput || usernameInput.length < 3) {
      setIsAvailable(null);
      setErrorMsg(usernameInput.length > 0 ? 'Username must be at least 3 characters long' : '');
      return;
    }

    if (usernameInput.length > 20) {
      setIsAvailable(false);
      setErrorMsg('Username must be 20 characters or less.');
      return;
    }

    const timer = setTimeout(async () => {
      setChecking(true);
      setErrorMsg('');
      try {
        const token = await getAuthToken();
        const res = await fetch(`${API_BASE}/users/check-username?username=${encodeURIComponent(usernameInput)}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        const json = await res.json();
        if (json.success) {
          setIsAvailable(json.data.available);
          if (!json.data.available) {
            setErrorMsg('That username is already taken. Try another!');
          }
        } else {
          setErrorMsg(json.error?.message || 'That username is already taken.');
        }
      } catch (err) {
        console.error('[CHECK USERNAME ERROR]', err);
        setErrorMsg('Network error checking username.');
      } finally {
        setChecking(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [usernameInput, isOpen, step]);

  if (!isOpen) return null;

  // Step 1: Claim Username Submit
  const handleClaimUsername = async (e) => {
    e.preventDefault();
    if (!usernameInput || !isAvailable || submitting) return;

    setSubmitting(true);
    setErrorMsg('');
    try {
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE}/users/claim-username`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ username: usernameInput })
      });

      const json = await res.json();
      if (json.success) {
        setUser(prev => ({
          ...prev,
          username: json.data.user.username,
          handle: `@${json.data.user.username}`
        }));
        // Move to Step 2: Minimal Profile Completion
        setStep(2);
      } else {
        setErrorMsg(json.error?.message || 'That username is already taken. Try another!');
        setIsAvailable(false);
      }
    } catch (err) {
      console.error('[CLAIM USERNAME ERROR]', err);
      setErrorMsg('Network error claiming username. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Step 2: Complete Profile Submit
  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    setSubmitting(true);

    try {
      const token = await getAuthToken();
      if (token) {
        await fetch(`${API_BASE}/users/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            displayName: displayName || user.name,
            bio: bio || '',
            avatarUrl: selectedAvatar || ''
          })
        });
      }

      setUser(prev => ({
        ...prev,
        name: displayName || prev.name,
        avatarUrl: selectedAvatar || prev.avatarUrl,
        bio: bio || prev.bio
      }));

      showToast(`Welcome to ScrollNom, @${user.username || usernameInput}! 🎉`, 'success');
      if (onComplete) onComplete();
      onClose();
    } catch (err) {
      console.error('[UPDATE PROFILE ERROR]', err);
      if (onComplete) onComplete();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-md bg-brand-cream rounded-3xl p-6 shadow-floating border border-brand-cream-dark space-y-6 animate-slide-up relative">
        
        {/* Step Indicator */}
        <div className="flex items-center justify-between text-xs font-bold text-brand-charcoal-muted border-b border-brand-cream-dark pb-3">
          <span className="text-brand-coral uppercase tracking-wider font-extrabold">
            Step {step} of 2 • {step === 1 ? 'Username' : 'Profile Setup'}
          </span>
          <div className="flex space-x-1">
            <div className={`w-6 h-1.5 rounded-full ${step >= 1 ? 'bg-brand-coral' : 'bg-gray-300'}`} />
            <div className={`w-6 h-1.5 rounded-full ${step >= 2 ? 'bg-brand-coral' : 'bg-gray-300'}`} />
          </div>
        </div>

        {/* STEP 1: CHOOSE USERNAME */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-16 h-16 rounded-3xl bg-brand-coral/10 border border-brand-coral/30 flex items-center justify-center">
                <ScrollNomLogoIcon className="w-10 h-10 text-brand-coral animate-bounce-mascot" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-brand-charcoal font-sans">
                  Choose your @username
                </h2>
                <p className="text-xs text-brand-charcoal-muted mt-1">
                  Your unique handle on ScrollNom. Friends will use this to find and tag you.
                </p>
              </div>
            </div>

            <form onSubmit={handleClaimUsername} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-brand-charcoal uppercase tracking-wider">
                  Pick Username
                </label>

                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-brand-coral font-black text-base">@</span>
                  <input
                    type="text"
                    required
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="username"
                    className="w-full pl-9 pr-10 py-3 rounded-2xl bg-white border border-brand-cream-dark text-brand-charcoal text-sm focus:outline-none focus:border-brand-coral font-bold transition-all"
                  />

                  {checking ? (
                    <div className="absolute right-3 w-4 h-4 border-2 border-brand-coral border-t-transparent rounded-full animate-spin" />
                  ) : isAvailable === true ? (
                    <CheckCircle2 className="w-5 h-5 absolute right-3 text-emerald-500" />
                  ) : isAvailable === false ? (
                    <XCircle className="w-5 h-5 absolute right-3 text-rose-500" />
                  ) : null}
                </div>

                {/* Helper / Success Message */}
                {isAvailable === true && (
                  <p className="text-xs text-emerald-600 font-bold flex items-center space-x-1 mt-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>@<strong>{usernameInput}</strong> is Available ✓</span>
                  </p>
                )}

                {errorMsg && (
                  <p className="text-xs text-rose-600 font-bold mt-1">{errorMsg}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={!isAvailable || submitting || checking}
                className={`w-full py-3.5 px-4 rounded-2xl font-extrabold text-sm flex items-center justify-center space-x-2 transition-all shadow-coral ${
                  isAvailable && !submitting && !checking
                    ? 'bg-brand-coral hover:bg-brand-coral-dark text-white active:scale-98 cursor-pointer'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <span>{submitting ? 'Claiming Username...' : 'Continue'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: MINIMAL PROFILE COMPLETION */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-extrabold text-brand-charcoal font-sans">
                Complete Your Profile
              </h2>
              <p className="text-xs text-brand-charcoal-muted">
                Add a display name & avatar to personalize your ScrollNom experience.
              </p>
            </div>

            {/* Avatar Selector */}
            <div className="space-y-2 text-center">
              <label className="block text-xs font-bold text-brand-charcoal uppercase tracking-wider">
                Select Profile Picture
              </label>
              <div className="flex items-center justify-center space-x-3">
                {FOOD_AVATARS.map((avatar, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedAvatar(avatar)}
                    className={`relative rounded-full p-0.5 border-2 transition-all ${
                      selectedAvatar === avatar ? 'border-brand-coral scale-110 shadow-coral' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={avatar} alt={`Avatar ${idx}`} className="w-12 h-12 rounded-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-brand-charcoal mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your Full Name"
                  className="w-full p-3 rounded-2xl bg-white border border-brand-cream-dark text-brand-charcoal text-xs font-bold focus:outline-none focus:border-brand-coral"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-charcoal mb-1">
                  Bio <span className="text-brand-charcoal-muted font-normal">(Optional)</span>
                </label>
                <textarea
                  rows="2"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Food lover, biryani connoisseur..."
                  className="w-full p-3 rounded-2xl bg-white border border-brand-cream-dark text-brand-charcoal text-xs font-medium focus:outline-none focus:border-brand-coral"
                />
              </div>

              <div className="pt-2 flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => handleSaveProfile()}
                  className="flex-1 py-3 px-4 bg-brand-cream-card border border-brand-cream-dark text-brand-charcoal font-bold text-xs rounded-2xl hover:bg-white flex items-center justify-center space-x-1"
                >
                  <SkipForward className="w-3.5 h-3.5 text-brand-teal" />
                  <span>Skip for now</span>
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 px-4 bg-brand-coral text-white font-extrabold text-xs rounded-2xl shadow-coral hover:bg-brand-coral-dark flex items-center justify-center space-x-1 transition-all active:scale-98"
                >
                  <span>{submitting ? 'Saving...' : 'Save & Explore'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

export default UsernameOnboardingModal;
