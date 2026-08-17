import Razorpay from 'razorpay';
import dotenv from 'dotenv';

dotenv.config();

const keyId = process.env.RAZORPAY_KEY_ID || '';
const keySecret = process.env.RAZORPAY_KEY_SECRET || '';

// Detect if we have real Razorpay credentials (must start with rzp_test_ or rzp_live_ and not contain 'mock')
const hasRealCredentials = keyId.startsWith('rzp_') && keySecret.length > 0 && !keyId.includes('mock') && !keySecret.includes('mock');

export const isMockCredentials = !hasRealCredentials;

// Only instantiate the Razorpay SDK if we have real credentials — avoids auth errors with fake keys
let razorpayInstance = null;
if (hasRealCredentials) {
  try {
    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });
  } catch (err) {
    console.error('[RAZORPAY CONFIG] Failed to initialize Razorpay SDK:', err.message);
  }
}

export const razorpay = razorpayInstance;

export const getRazorpayConfig = () => ({
  keyId: hasRealCredentials ? keyId : 'rzp_test_scrollnom_demo',
  isTestMode: true,
  isMock: isMockCredentials
});
