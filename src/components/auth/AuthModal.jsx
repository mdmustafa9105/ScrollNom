import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ScrollNomLogoIcon } from '../brand/IconSet';
import { formatAuthError } from '../../utils/authErrors';
import { X, ArrowRight, Mail, Lock, Eye, EyeOff, Maximize2 } from 'lucide-react';

export const AuthModal = () => {
  const {
    authModal,
    closeAuthModal,
    loginWithGoogle,
    loginWithEmail,
    setActiveTab
  } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!authModal.isOpen) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      await loginWithGoogle();
      closeAuthModal();
    } catch (err) {
      console.error('[GOOGLE AUTH MODAL ERROR]', err);
      setError(err.message || 'Google Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError('');
    try {
      await loginWithEmail(email, password, isRegisterMode);
      closeAuthModal();
    } catch (err) {
      console.error('[EMAIL AUTH MODAL ERROR]', err);
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenFullAuthPage = () => {
    closeAuthModal();
    setActiveTab('auth');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
      <div className="w-full max-w-md bg-brand-cream rounded-t-3xl sm:rounded-3xl p-6 shadow-floating border border-brand-cream-dark relative animate-slide-up">
        
        {/* Actions Bar: Expand to Full Screen & Close Button */}
        <div className="absolute top-4 right-4 flex items-center space-x-2">
          <button
            type="button"
            onClick={handleOpenFullAuthPage}
            className="p-2 rounded-full bg-brand-cream-card text-brand-charcoal-muted hover:text-brand-coral transition-colors"
            title="Open Full Screen Sign In"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={closeAuthModal}
            className="p-2 rounded-full bg-brand-cream-card text-brand-charcoal-muted hover:text-brand-charcoal transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mt-2 mb-6">
          <ScrollNomLogoIcon className="w-14 h-14 mb-2 animate-bounce-mascot text-brand-coral" />
          <h2 className="text-xl font-extrabold text-brand-charcoal font-sans">
            {authModal.title || 'Welcome to ScrollNom'}
          </h2>

          {authModal.pendingDish && (
            <div className="mt-3 bg-brand-coral/10 border border-brand-coral/20 px-3 py-2 rounded-xl flex items-center space-x-3 w-full text-left">
              <img
                src={authModal.pendingDish.posterUrl || authModal.pendingDish.image}
                alt={authModal.pendingDish.title || 'Target Dish'}
                className="w-12 h-12 rounded-lg object-cover"
              />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold text-brand-coral uppercase tracking-wider block">Target Order</span>
                <p className="text-xs font-bold text-brand-charcoal truncate">{authModal.pendingDish.title || authModal.pendingDish.dishName}</p>
                <span className="text-xs font-semibold text-brand-teal">₹{authModal.pendingDish.dishPrice || authModal.pendingDish.price}</span>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          
          {/* GOOGLE SIGN IN BUTTON */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3.5 px-4 bg-white border border-brand-cream-dark text-brand-charcoal font-extrabold text-sm rounded-2xl shadow-soft hover:bg-gray-50 flex items-center justify-center space-x-3 transition-all active:scale-98"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="flex items-center my-3">
            <div className="flex-1 border-t border-brand-cream-dark" />
            <span className="px-3 text-xs font-bold text-brand-charcoal-muted uppercase">or Email</span>
            <div className="flex-1 border-t border-brand-cream-dark" />
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-brand-charcoal-muted mb-1">
                Email Address
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 absolute left-3 text-brand-teal" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-brand-cream-card border border-brand-cream-dark text-brand-charcoal text-xs font-medium focus:outline-none focus:border-brand-coral"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-charcoal-muted mb-1">
                Password
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 absolute left-3 text-brand-teal" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-brand-cream-card border border-brand-cream-dark text-brand-charcoal text-xs font-medium focus:outline-none focus:border-brand-coral"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-brand-charcoal-muted hover:text-brand-charcoal p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs font-bold text-rose-500 bg-rose-50 p-2 rounded-lg border border-rose-200">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-brand-coral text-white font-extrabold text-xs rounded-2xl shadow-coral hover:bg-brand-coral-dark flex items-center justify-center space-x-2 transition-all active:scale-98"
            >
              <span>{isRegisterMode ? 'Create Account & Sign In' : 'Sign In with Email'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-between pt-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setIsRegisterMode(!isRegisterMode)}
                className="text-brand-teal hover:underline"
              >
                {isRegisterMode ? 'Already have an account? Sign In' : 'Need an account? Register'}
              </button>

              <button
                type="button"
                onClick={handleOpenFullAuthPage}
                className="text-brand-coral hover:underline"
              >
                Full Sign In Page →
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};
