import React, { useState, useEffect } from 'react';
import { X, CreditCard, Smartphone, Building2, Wallet, ChevronRight, Shield, Check, Copy } from 'lucide-react';

const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI', icon: Smartphone, description: 'Google Pay, PhonePe, Paytm & more', apps: ['Google Pay', 'PhonePe', 'Paytm', 'BHIM UPI'] },
  { id: 'card', label: 'Card', icon: CreditCard, description: 'Visa, Mastercard, RuPay', fields: true },
  { id: 'netbanking', label: 'Net Banking', icon: Building2, description: 'All Indian banks supported', banks: ['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra Bank', 'Punjab National Bank', 'Bank of Baroda', 'IDFC FIRST Bank'] },
  { id: 'wallet', label: 'Wallet', icon: Wallet, description: 'Paytm, Amazon Pay, Mobikwik', wallets: ['Paytm Wallet', 'Amazon Pay', 'Mobikwik', 'Freecharge'] },
];

// Razorpay brand colors
const RZP_BLUE = '#072654';
const RZP_BLUE_LIGHT = '#1a3a6b';
const RZP_GREEN = '#00B300';
const RZP_BORDER = '#e0e0e0';

export const MockRazorpayModal = ({ isOpen, onClose, onPaymentSuccess, amount, merchantName, orderId, userEmail, userName, userPhone }) => {
  const [step, setStep] = useState('methods'); // methods | processing | success
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [selectedSubOption, setSelectedSubOption] = useState(null);
  const [upiId, setUpiId] = useState('');
  const [countdown, setCountdown] = useState(3);
  const [copied, setCopied] = useState(false);

  const [processingStage, setProcessingStage] = useState('Connecting to bank securely...');

  const paymentId = `pay_${Math.random().toString(36).substring(2, 16).toUpperCase()}`;
  const displayAmount = typeof amount === 'number' ? amount.toLocaleString('en-IN') : amount;

  useEffect(() => {
    if (step === 'success') {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            // Auto-close and trigger success callback
            setTimeout(() => {
              if (onPaymentSuccess) {
                onPaymentSuccess({
                  razorpay_payment_id: paymentId,
                  razorpay_order_id: orderId || `order_mock_${Date.now()}`,
                  razorpay_signature: `mock_sig_${paymentId}`,
                  mockOrderId: orderId
                });
              }
            }, 300);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setStep('methods');
      setSelectedMethod(null);
      setSelectedSubOption(null);
      setUpiId('');
      setCountdown(3);
      setProcessingStage('Connecting to bank securely...');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePay = () => {
    setStep('processing');
    setProcessingStage('Connecting to bank securely...');

    setTimeout(() => setProcessingStage('Authenticating payment...'), 1200);
    setTimeout(() => setProcessingStage('Processing transaction...'), 2400);
    setTimeout(() => setProcessingStage('Verifying with bank...'), 3600);
    setTimeout(() => {
      setStep('success');
    }, 4500);
  };

  const handleCopyPaymentId = () => {
    navigator.clipboard?.writeText(paymentId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const canPay = () => {
    if (!selectedMethod) return false;
    if (selectedMethod === 'upi' && !selectedSubOption && !upiId.includes('@')) return false;
    if (selectedMethod === 'netbanking' && !selectedSubOption) return false;
    if (selectedMethod === 'wallet' && !selectedSubOption) return false;
    return true;
  };

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif" }}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={step === 'success' ? undefined : onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-[420px] mx-4 animate-fade-in" style={{ maxHeight: '90vh' }}>

        {/* ─── STEP: PAYMENT METHODS ─── */}
        {step === 'methods' && (
          <div className="rounded-xl overflow-hidden shadow-2xl" style={{ background: '#fff' }}>
            {/* Header */}
            <div className="px-5 py-4 flex items-center justify-between" style={{ background: RZP_BLUE }}>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M22 9.5L14.5 2 7.5 9.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 22L9.5 14.5 17 22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{merchantName || 'ScrollNom Food Delivery'}</p>
                  <p className="text-white/60 text-xs">{orderId || 'Order'}</p>
                </div>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors">
                <X className="w-5 h-5 text-white/80" />
              </button>
            </div>

            {/* Amount Bar */}
            <div className="px-5 py-3 flex items-center justify-between border-b" style={{ background: '#f7f9fc', borderColor: RZP_BORDER }}>
              <span className="text-xs text-gray-500">Amount Payable</span>
              <span className="text-xl font-bold" style={{ color: RZP_BLUE }}>₹{displayAmount}</span>
            </div>

            {/* Contact Info */}
            <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: RZP_BORDER }}>
              <div className="text-xs text-gray-500">
                <span>{userEmail || 'customer@scrollnom.com'}</span>
                <span className="mx-2">|</span>
                <span>{userPhone || '+91 98765 43210'}</span>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="px-4 py-3" style={{ maxHeight: '380px', overflowY: 'auto' }}>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">Payment Method</p>

              {PAYMENT_METHODS.map(method => {
                const Icon = method.icon;
                const isSelected = selectedMethod === method.id;

                return (
                  <div key={method.id} className="mb-2">
                    <button
                      onClick={() => { setSelectedMethod(method.id); setSelectedSubOption(null); setUpiId(''); }}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all"
                      style={{
                        background: isSelected ? '#f0f4ff' : '#fff',
                        border: `1.5px solid ${isSelected ? '#528ff0' : '#e8e8e8'}`,
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: isSelected ? '#528ff0' : '#f0f0f0' }}>
                          <Icon className="w-4 h-4" style={{ color: isSelected ? '#fff' : '#666' }} />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-semibold" style={{ color: RZP_BLUE }}>{method.label}</p>
                          <p className="text-[11px] text-gray-400">{method.description}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300" style={{ transform: isSelected ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                    </button>

                    {/* Expanded Sub-Options */}
                    {isSelected && (
                      <div className="mt-1 ml-4 mr-2 animate-fade-in">
                        {/* UPI */}
                        {method.id === 'upi' && (
                          <div className="p-3 space-y-2">
                            <div className="flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                              <input
                                type="text"
                                placeholder="Enter UPI ID (e.g. name@upi)"
                                value={upiId}
                                onChange={(e) => { setUpiId(e.target.value); setSelectedSubOption(null); }}
                                className="flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder-gray-400"
                              />
                            </div>
                            <p className="text-[11px] text-gray-400 px-1">Or choose an app:</p>
                            <div className="grid grid-cols-2 gap-1.5">
                              {method.apps.map(app => (
                                <button
                                  key={app}
                                  onClick={() => { setSelectedSubOption(app); setUpiId(''); }}
                                  className="text-xs font-medium py-2 px-3 rounded-md transition-all text-left"
                                  style={{
                                    background: selectedSubOption === app ? '#528ff0' : '#f5f5f5',
                                    color: selectedSubOption === app ? '#fff' : '#444',
                                    border: `1px solid ${selectedSubOption === app ? '#528ff0' : '#e5e5e5'}`,
                                  }}
                                >
                                  {app}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Card */}
                        {method.id === 'card' && (
                          <div className="p-3 space-y-2">
                            <input
                              type="text"
                              placeholder="Card Number"
                              maxLength={19}
                              defaultValue="4111 1111 1111 1111"
                              className="w-full text-sm bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 outline-none focus:border-blue-400 text-gray-700"
                              onFocus={() => setSelectedSubOption('card_filled')}
                            />
                            <div className="flex space-x-2">
                              <input type="text" placeholder="MM/YY" defaultValue="12/28" maxLength={5} className="w-1/2 text-sm bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 outline-none focus:border-blue-400 text-gray-700" onFocus={() => setSelectedSubOption('card_filled')} />
                              <input type="text" placeholder="CVV" defaultValue="***" maxLength={4} className="w-1/2 text-sm bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 outline-none focus:border-blue-400 text-gray-700" onFocus={() => setSelectedSubOption('card_filled')} />
                            </div>
                            <input type="text" placeholder="Name on card" defaultValue={userName || 'ScrollNom Customer'} className="w-full text-sm bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 outline-none focus:border-blue-400 text-gray-700" onFocus={() => setSelectedSubOption('card_filled')} />
                          </div>
                        )}

                        {/* Net Banking */}
                        {method.id === 'netbanking' && (
                          <div className="p-3 space-y-1.5 max-h-48 overflow-y-auto">
                            {method.banks.map(bank => (
                              <button
                                key={bank}
                                onClick={() => setSelectedSubOption(bank)}
                                className="w-full flex items-center justify-between text-xs font-medium py-2.5 px-3 rounded-md transition-all"
                                style={{
                                  background: selectedSubOption === bank ? '#528ff0' : '#f8f8f8',
                                  color: selectedSubOption === bank ? '#fff' : '#444',
                                  border: `1px solid ${selectedSubOption === bank ? '#528ff0' : '#ececec'}`,
                                }}
                              >
                                <span>{bank}</span>
                                {selectedSubOption === bank && <Check className="w-3.5 h-3.5" />}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Wallets */}
                        {method.id === 'wallet' && (
                          <div className="p-3 grid grid-cols-2 gap-1.5">
                            {method.wallets.map(w => (
                              <button
                                key={w}
                                onClick={() => setSelectedSubOption(w)}
                                className="text-xs font-medium py-2.5 px-3 rounded-md transition-all text-left"
                                style={{
                                  background: selectedSubOption === w ? '#528ff0' : '#f5f5f5',
                                  color: selectedSubOption === w ? '#fff' : '#444',
                                  border: `1px solid ${selectedSubOption === w ? '#528ff0' : '#e5e5e5'}`,
                                }}
                              >
                                {w}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pay Button */}
            <div className="px-5 pb-4 pt-2">
              <button
                onClick={handlePay}
                disabled={!canPay()}
                className="w-full py-3.5 rounded-lg text-white font-bold text-sm transition-all flex items-center justify-center space-x-2"
                style={{
                  background: canPay() ? '#528ff0' : '#b0c4de',
                  cursor: canPay() ? 'pointer' : 'not-allowed',
                  opacity: canPay() ? 1 : 0.7,
                }}
              >
                <Shield className="w-4 h-4" />
                <span>Pay ₹{displayAmount}</span>
              </button>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 flex items-center justify-center space-x-2 border-t" style={{ borderColor: RZP_BORDER, background: '#fafafa' }}>
              <span className="text-[10px] text-gray-400">Secured by</span>
              <span className="text-[11px] font-bold" style={{ color: RZP_BLUE }}>Razorpay</span>
              <Shield className="w-3 h-3 text-gray-400" />
            </div>
          </div>
        )}

        {/* ─── STEP: PROCESSING ─── */}
        {step === 'processing' && (
          <div className="rounded-xl overflow-hidden shadow-2xl" style={{ background: '#fff' }}>
            <div className="px-5 py-4" style={{ background: RZP_BLUE }}>
              <div className="flex items-center justify-between">
                <p className="text-white font-semibold text-sm">{merchantName || 'ScrollNom Food Delivery'}</p>
                <span className="text-white/60 text-xs">₹{displayAmount}</span>
              </div>
            </div>

            <div className="py-10 flex flex-col items-center justify-center space-y-6 relative overflow-hidden" style={{ minHeight: '320px' }}>
              {/* Animated Gold Coin */}
              <div className="rzp-coin-container">
                <div className="rzp-coin">
                  <div className="rzp-coin-face rzp-coin-front">₹</div>
                  <div className="rzp-coin-face rzp-coin-back">✓</div>
                </div>
              </div>

              {/* Progress stages */}
              <div className="text-center space-y-2 mt-4">
                <p className="text-base font-semibold" style={{ color: RZP_BLUE }}>{processingStage}</p>
                <p className="text-xs text-gray-400">Please do not close this window</p>
              </div>

              {/* Progress bar */}
              <div className="w-56 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="rzp-progress-bar h-full rounded-full" style={{ background: 'linear-gradient(90deg, #528ff0, #2563eb)' }} />
              </div>

              {/* Security badges */}
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-1.5 bg-green-50 px-3 py-1.5 rounded-full">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[10px] text-green-600 font-semibold">256-bit SSL</span>
                </div>
                <div className="flex items-center space-x-1.5 bg-blue-50 px-3 py-1.5 rounded-full">
                  <Shield className="w-3 h-3 text-blue-500" />
                  <span className="text-[10px] text-blue-600 font-semibold">PCI DSS</span>
                </div>
              </div>
            </div>

            <div className="px-5 py-3 flex items-center justify-center border-t" style={{ borderColor: RZP_BORDER, background: '#fafafa' }}>
              <span className="text-[10px] text-gray-400">Secured by</span>
              <span className="text-[11px] font-bold ml-1.5" style={{ color: RZP_BLUE }}>Razorpay</span>
            </div>
          </div>
        )}

        {/* ─── STEP: SUCCESS ─── */}
        {step === 'success' && (
          <div className="rounded-xl overflow-hidden shadow-2xl">
            {/* Green Success Area */}
            <div className="py-12 flex flex-col items-center justify-center space-y-4" style={{ background: RZP_GREEN }}>
              <p className="text-white/80 text-sm">You will be redirected in {countdown} seconds</p>
              <h2 className="text-white text-2xl font-bold">Payment Successful</h2>

              {/* Animated Checkmark */}
              <div className="relative w-24 h-24 mt-2">
                <div className="absolute inset-0 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
                <div className="absolute inset-3 rounded-full bg-white/20 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center">
                    <svg width="32" height="32" viewBox="0 0 32 32" className="animate-fade-in">
                      <circle cx="16" cy="16" r="14" fill="none" stroke="#00B300" strokeWidth="2.5" />
                      <path d="M10 16.5L14 20.5L22 12.5" stroke="#F5A623" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"
                        style={{ strokeDasharray: 24, strokeDashoffset: 0, animation: 'checkmark-draw 0.4s ease-out forwards' }}
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Receipt */}
            <div className="bg-white px-6 py-5 mx-4 -mt-4 rounded-xl shadow-lg relative z-10 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-800 text-sm">{merchantName || 'ScrollNom Food Delivery'}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{dateStr} at {timeStr}</p>
                </div>
                <p className="text-xl font-bold" style={{ color: '#333' }}>₹ {displayAmount}</p>
              </div>

              <div className="border-t border-dashed border-gray-200 pt-3 flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {selectedMethod === 'card' ? 'Card' : selectedMethod === 'upi' ? 'UPI' : selectedMethod === 'netbanking' ? 'Net Banking' : 'Wallet'}
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-600 font-mono">{paymentId}</span>
                  <button onClick={handleCopyPaymentId} className="text-gray-400 hover:text-gray-600 transition-colors">
                    {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Powered By Footer */}
            <div className="bg-white rounded-b-xl px-5 py-4 mt-0 flex items-center justify-center">
              <div className="flex items-center space-x-2 bg-gray-100 px-4 py-2 rounded-full">
                <span className="text-[10px] text-gray-400">Powered by</span>
                <span className="text-[11px] font-bold" style={{ color: RZP_BLUE }}>Razorpay</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes checkmark-draw {
          from { stroke-dashoffset: 24; }
          to { stroke-dashoffset: 0; }
        }

        /* Gold Coin Container — bounce + float */
        .rzp-coin-container {
          perspective: 600px;
          width: 80px;
          height: 80px;
          animation: rzp-coin-bounce 2s ease-in-out infinite, rzp-coin-float 3s ease-in-out infinite;
        }

        /* Gold Coin — 3D flip */
        .rzp-coin {
          width: 80px;
          height: 80px;
          position: relative;
          transform-style: preserve-3d;
          animation: rzp-coin-flip 1.8s ease-in-out infinite;
        }

        .rzp-coin-face {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          font-weight: 800;
          backface-visibility: hidden;
          border: 3px solid #d4a017;
          box-shadow: 0 0 20px rgba(255, 193, 7, 0.4), inset 0 0 15px rgba(255, 215, 0, 0.3);
        }

        .rzp-coin-front {
          background: linear-gradient(145deg, #ffd700, #f0c020, #e6b800);
          color: #8B6914;
        }

        .rzp-coin-back {
          background: linear-gradient(145deg, #f0c020, #ffd700, #e6b800);
          color: #2e7d32;
          transform: rotateY(180deg);
        }

        @keyframes rzp-coin-flip {
          0%   { transform: rotateY(0deg); }
          50%  { transform: rotateY(180deg); }
          100% { transform: rotateY(360deg); }
        }

        @keyframes rzp-coin-bounce {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-18px); }
        }

        @keyframes rzp-coin-float {
          0%, 100% { filter: drop-shadow(0 8px 12px rgba(255, 193, 7, 0.3)); }
          50%      { filter: drop-shadow(0 16px 24px rgba(255, 193, 7, 0.5)); }
        }

        /* Progress bar animation */
        .rzp-progress-bar {
          animation: rzp-progress-fill 4.5s ease-out forwards;
        }

        @keyframes rzp-progress-fill {
          0%   { width: 0%; }
          20%  { width: 25%; }
          45%  { width: 50%; }
          70%  { width: 75%; }
          90%  { width: 92%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default MockRazorpayModal;
