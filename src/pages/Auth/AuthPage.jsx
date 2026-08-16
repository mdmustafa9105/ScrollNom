import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ScrollNomLogoIcon } from '../../components/brand/IconSet';
import { formatAuthError } from '../../utils/authErrors';
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  KeyRound,
  X,
  Compass,
  Play,
  ShoppingBag
} from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../config/firebase';

export const AuthPage = () => {
  const {
    loginWithGoogle,
    loginWithEmail,
    setActiveTab,
    showToast,
    authModal,
    closeAuthModal
  } = useApp();

  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error('[AUTH PAGE GOOGLE ERROR]', err);
      setError(err.message || 'Google Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Email Auth (Login or Signup)
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please re-enter.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      await loginWithEmail(email, password, mode === 'signup', displayName);
    } catch (err) {
      console.error('[AUTH PAGE EMAIL ERROR]', err);
      setError(err.message || 'Authentication failed. Please verify your details.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Password Reset Request
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail) return;
    setResetLoading(true);
    setResetMessage('');
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetMessage('Password reset link sent to your email! Check your inbox.');
      showToast('Password reset email sent!', 'info');
    } catch (err) {
      console.error('[RESET PASSWORD ERROR]', err);
      setResetMessage(formatAuthError(err));
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-cream flex flex-col justify-center py-6 px-4 sm:px-6 lg:px-12 animate-fade-in relative">
      
      {/* Top Header Bar with Back Button */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between mb-4">
        <button
          onClick={() => setActiveTab('home')}
          className="flex items-center space-x-2 text-brand-charcoal hover:text-brand-coral font-bold text-xs bg-brand-cream-card px-3.5 py-2 rounded-xl border border-brand-cream-dark shadow-soft transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        <div className="flex items-center space-x-2">
          <ScrollNomLogoIcon className="w-7 h-7 text-brand-coral" />
          <span className="font-extrabold text-sm text-brand-coral font-sans">scrollnom</span>
        </div>
      </div>

      {/* Main Container: Mobile Single Column / Desktop 2-Column */}
      <div className="max-w-5xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* LEFT COLUMN: DESKTOP BRAND HERO SHOWCASE (Hidden on mobile, 6 cols on desktop) */}
        <div className="hidden lg:flex lg:col-span-6 flex-col justify-between p-8 bg-gradient-to-br from-brand-coral/10 via-brand-cream-card to-brand-gold/10 rounded-3xl border border-brand-cream-dark shadow-soft relative overflow-hidden min-h-[540px]">
          
          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center space-x-2 bg-brand-coral/15 px-3 py-1.5 rounded-full border border-brand-coral/30">
              <Sparkles className="w-4 h-4 text-brand-coral animate-pulse-glow" />
              <span className="text-xs font-extrabold text-brand-coral uppercase tracking-wider">
                Discover • Nom • Order
              </span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl lg:text-4xl font-extrabold text-brand-charcoal tracking-tight font-sans leading-tight">
                Taste the Feed. <br />
                <span className="text-brand-coral">Order the Dish.</span>
              </h1>
              <p className="text-xs text-brand-charcoal-muted font-medium leading-relaxed max-w-md">
                Experience short video food reels, real-time split payments with friends, and seamless food delivery from top restaurants in your city.
              </p>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-white/80 backdrop-blur-sm p-3.5 rounded-2xl border border-brand-cream-dark flex items-center space-x-3 shadow-sm">
                <div className="w-9 h-9 rounded-xl bg-brand-coral/10 flex items-center justify-center text-brand-coral">
                  <Play className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-brand-charcoal">Nommly Reels</h4>
                  <p className="text-[10px] text-brand-charcoal-muted">Visual food reviews</p>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm p-3.5 rounded-2xl border border-brand-cream-dark flex items-center space-x-3 shadow-sm">
                <div className="w-9 h-9 rounded-xl bg-brand-teal/10 flex items-center justify-center text-brand-teal">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-brand-charcoal">Food on Friend</h4>
                  <p className="text-[10px] text-brand-charcoal-muted">Instant group split</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Trust Badge */}
          <div className="relative z-10 pt-6 border-t border-brand-cream-dark/60 flex items-center justify-between text-xs font-bold text-brand-charcoal-muted">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Real-time Order Tracking</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Verified Creators</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: AUTHENTICATION FORM CONTAINER (6 cols on desktop) */}
        <div className="lg:col-span-6 bg-brand-cream-card rounded-3xl p-6 sm:p-8 border border-brand-cream-dark shadow-floating space-y-6 relative">
          
          {/* Mode Switcher Tabs */}
          <div className="flex bg-brand-cream p-1.5 rounded-2xl border border-brand-cream-dark">
            <button
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs transition-all ${
                mode === 'login'
                  ? 'bg-white text-brand-coral shadow-soft'
                  : 'text-brand-charcoal-muted hover:text-brand-charcoal'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('signup'); setError(''); }}
              className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs transition-all ${
                mode === 'signup'
                  ? 'bg-white text-brand-coral shadow-soft'
                  : 'text-brand-charcoal-muted hover:text-brand-charcoal'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Heading */}
          <div className="text-center space-y-1">
            <h2 className="text-xl sm:text-2xl font-extrabold text-brand-charcoal font-sans">
              {mode === 'login' ? 'Welcome Back to ScrollNom' : 'Create your ScrollNom account'}
            </h2>
            <p className="text-xs text-brand-charcoal-muted">
              {mode === 'login'
                ? 'Enter your credentials to manage your food orders'
                : 'Join thousands of foodies ordering & sharing dishes'}
            </p>
          </div>

          {/* GOOGLE SIGN IN BUTTON */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3.5 px-4 bg-white border border-brand-cream-dark text-brand-charcoal font-extrabold text-xs rounded-2xl shadow-soft hover:bg-gray-50 flex items-center justify-center space-x-3 transition-all active:scale-98"
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

          <div className="flex items-center my-4">
            <div className="flex-1 border-t border-brand-cream-dark" />
            <span className="px-3 text-[11px] font-extrabold text-brand-charcoal-muted uppercase tracking-wider">
              or Email
            </span>
            <div className="flex-1 border-t border-brand-cream-dark" />
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-brand-charcoal mb-1">
                  Full Name / Display Name
                </label>
                <div className="relative flex items-center">
                  <User className="w-4 h-4 absolute left-3.5 text-brand-teal" />
                  <input
                    type="text"
                    required={mode === 'signup'}
                    placeholder="Alex Morgan"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-brand-cream-dark text-brand-charcoal text-xs font-semibold focus:outline-none focus:border-brand-coral"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-brand-charcoal mb-1">
                Email Address
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 absolute left-3.5 text-brand-teal" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-brand-cream-dark text-brand-charcoal text-xs font-semibold focus:outline-none focus:border-brand-coral"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-brand-charcoal">
                  Password
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => { setShowForgotModal(true); setResetEmail(email); }}
                    className="text-[11px] font-bold text-brand-teal hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 absolute left-3.5 text-brand-teal" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-2xl bg-white border border-brand-cream-dark text-brand-charcoal text-xs font-semibold focus:outline-none focus:border-brand-coral"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-brand-charcoal-muted hover:text-brand-charcoal p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-brand-charcoal mb-1">
                  Confirm Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 absolute left-3.5 text-brand-teal" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required={mode === 'signup'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-brand-cream-dark text-brand-charcoal text-xs font-semibold focus:outline-none focus:border-brand-coral"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs font-bold animate-shake">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-brand-coral text-white font-extrabold text-xs rounded-2xl shadow-coral hover:bg-brand-coral-dark flex items-center justify-center space-x-2 transition-all active:scale-98 cursor-pointer"
            >
              <span>
                {loading
                  ? 'Processing...'
                  : mode === 'signup'
                  ? 'Create ScrollNom Account'
                  : 'Sign In'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'login' ? 'signup' : 'login');
                  setError('');
                }}
                className="text-xs text-brand-teal font-bold hover:underline"
              >
                {mode === 'login'
                  ? "Don't have an account? Create your ScrollNom account"
                  : 'Already have an account? Sign In'}
              </button>
            </div>
          </form>

        </div>

      </div>

      {/* FORGOT PASSWORD MODAL */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-brand-cream rounded-3xl p-6 border border-brand-cream-dark shadow-floating space-y-4 relative animate-slide-up">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white text-brand-charcoal-muted hover:text-brand-charcoal"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-brand-teal/10 border border-brand-teal/20 flex items-center justify-center mx-auto text-brand-teal">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-brand-charcoal">Reset Password</h3>
              <p className="text-xs text-brand-charcoal-muted">
                Enter your email address and we'll send you a password reset link.
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-brand-charcoal mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-white border border-brand-cream-dark text-brand-charcoal text-xs font-bold focus:outline-none focus:border-brand-coral"
                />
              </div>

              {resetMessage && (
                <p className={`text-xs font-bold ${resetMessage.includes('sent') ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {resetMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={resetLoading}
                className="w-full py-3 bg-brand-teal text-white font-extrabold text-xs rounded-2xl shadow-soft hover:bg-brand-teal-light transition-all"
              >
                {resetLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AuthPage;
