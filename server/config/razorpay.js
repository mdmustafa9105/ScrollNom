import Razorpay from 'razorpay';
import dotenv from 'dotenv';

dotenv.config();

const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_scrollnom_mock';
const keySecret = process.env.RAZORPAY_KEY_SECRET || 'scrollnom_test_secret_mock';

// Safe check: determine if credentials are mock/test placeholders
export const isMockCredentials = keyId.includes('mock') || keySecret.includes('mock');

export const razorpay = new Razorpay({
  key_id: keyId,
  key_secret: keySecret
});

export const getRazorpayConfig = () => ({
  keyId,
  isTestMode: true,
  isMock: isMockCredentials
});
