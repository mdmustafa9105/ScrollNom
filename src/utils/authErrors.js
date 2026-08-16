// Auth Error Formatter for ScrollNom Authentication & Onboarding
export const formatAuthError = (err) => {
  if (!err) return 'An unexpected error occurred. Please try again.';

  const code = err.code || '';
  const message = err.message || '';

  // Firebase Auth Error Codes
  if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
    return 'Incorrect password. Please try again or reset your password.';
  }
  if (code === 'auth/user-not-found') {
    return 'No account found with this email address. Please create an account.';
  }
  if (code === 'auth/invalid-email') {
    return 'Invalid email address. Please enter a valid email format (e.g. name@example.com).';
  }
  if (code === 'auth/email-already-in-use') {
    return 'An account with this email address already exists. Please sign in instead.';
  }
  if (code === 'auth/weak-password') {
    return 'Password is too weak. Please use at least 6 characters.';
  }
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return 'Google Sign In was cancelled. Please try again.';
  }
  if (code === 'auth/popup-blocked') {
    return 'Pop-up window was blocked by your browser. Please allow pop-ups for this site.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Network connection unavailable. Please check your internet connection.';
  }
  if (code === 'auth/user-token-expired' || code === 'auth/requires-recent-login') {
    return 'Your session has expired. Please sign in again.';
  }

  // Username Backend Error Codes
  if (message.includes('already taken') || code === 'USERNAME_TAKEN') {
    return 'That username is already taken. Try another!';
  }
  if (message.includes('invalid') || code === 'INVALID_USERNAME') {
    return 'Username must be 3-20 characters long and contain only lowercase letters, numbers, or underscores.';
  }

  // If a descriptive message exists (that isn't generic "Firebase: Error (auth/...)") return it
  if (message && !message.startsWith('Firebase:')) {
    return message;
  }

  return 'Authentication failed. Please verify your credentials and try again.';
};
