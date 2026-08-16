import React from 'react';

// Custom Brandkit icons for ScrollNom

export const ScrollNomLogoIcon = ({ className = "w-8 h-8", animate = false }) => (
  <div className={`relative inline-flex items-center justify-center ${animate ? 'animate-bounce-mascot' : ''}`}>
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Mascot Circle Body */}
      <circle cx="50" cy="45" r="32" fill="#FF5743" />
      
      {/* Fork Left */}
      <path d="M18 25V42C18 45 22 45 22 45V58" stroke="#FF5743" strokeWidth="4" strokeLinecap="round" />
      <path d="M14 25V35M22 25V35M26 25V35" stroke="#FF5743" strokeWidth="3" strokeLinecap="round" />
      
      {/* Spoon Right */}
      <path d="M82 25C87 25 90 32 87 38C84 44 78 44 78 44V58" stroke="#FF5743" strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="83" cy="30" rx="5" ry="8" fill="#FF5743" />

      {/* Eyes - Licking/Smiling */}
      <path d="M38 38C40 34 44 34 46 38" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M54 38C56 34 60 34 62 38" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
      
      {/* Tongue / Tongue licking */}
      <path d="M42 47C45 53 55 53 58 47" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M52 49C54 53 57 53 58 50" fill="#FFFBF2" stroke="#FF5743" strokeWidth="1.5" />

      {/* Unrolled Scroll Base */}
      <path d="M22 72C22 66 78 66 78 72C78 78 68 80 50 80C32 80 22 78 22 72Z" fill="#F2994A" />
      <path d="M18 72C18 64 26 64 26 72C26 80 18 80 18 72Z" fill="#E08838" />
    </svg>
  </div>
);

export const VeganShieldIcon = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 4L34 10V22C34 30 20 36 20 36C20 36 6 30 6 22V10L20 4Z" fill="#1A5B4C" />
    <path d="M20 12C20 12 14 18 14 24C14 26 16 28 20 28C24 28 26 26 26 24C26 18 20 12 20 12Z" stroke="#FFFBF2" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M20 17V27" stroke="#FFFBF2" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const HalalIcon = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon points="20,2 25,6 31,4 33,10 39,13 38,19 40,25 35,29 34,35 28,35 24,39 19,37 14,39 10,35 4,35 3,29 0,23 3,17 2,11 8,9 10,3 16,5" fill="#E64A38" />
    <text x="20" y="25" textAnchor="middle" fill="#FFFBF2" fontSize="13" fontWeight="bold" fontFamily="sans-serif">حلال</text>
  </svg>
);

export const SpiceLevelIndicator = ({ level = 2, className = "h-4" }) => {
  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {[1, 2, 3].map((i) => (
        <svg key={i} viewBox="0 0 24 24" className="w-4 h-4" fill={i <= level ? "#FF5743" : "#EFEADF"}>
          <path d="M12 2C11 5 8 7 8 11C8 14.3 10.7 17 14 17C15.5 17 17 16.5 18 15.5C17.5 19 14.5 22 10.5 22C6.4 22 3 18.6 3 14.5C3 10 7 4 12 2Z" />
        </svg>
      ))}
    </div>
  );
};

export const DeliveryTruckIcon = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 14H24V28H4V14Z" fill="#FF5743" />
    <path d="M24 18H32L36 23V28H24V18Z" fill="#F2994A" />
    <circle cx="10" cy="30" r="4" fill="#1A5B4C" />
    <circle cx="28" cy="30" r="4" fill="#1A5B4C" />
    <path d="M0 16H3M2 20H5M0 24H3" stroke="#FF5743" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const CategoryIcon = ({ type, className = "w-6 h-6" }) => {
  switch (type) {
    case 'burger':
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none">
          <path d="M6 14C6 9.5 10.5 6 16 6C21.5 6 26 9.5 26 14H6Z" fill="#F2994A" />
          <path d="M4 16H28" stroke="#1A5B4C" strokeWidth="3" strokeLinecap="round" />
          <path d="M6 20H26" stroke="#FF5743" strokeWidth="3" strokeLinecap="round" />
          <path d="M7 23C7 25 11 26 16 26C21 26 25 25 25 23H7Z" fill="#F2994A" />
        </svg>
      );
    case 'pizza':
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none">
          <path d="M16 4L28 26C28 26 21 28 16 28C11 28 4 26 4 26L16 4Z" fill="#F2994A" />
          <circle cx="14" cy="14" r="2.5" fill="#FF5743" />
          <circle cx="18" cy="20" r="2" fill="#FF5743" />
          <circle cx="11" cy="22" r="2" fill="#1A5B4C" />
        </svg>
      );
    case 'noodle':
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none">
          <path d="M6 16C6 21.5 10.5 26 16 26C21.5 26 26 21.5 26 16H6Z" fill="#FF5743" />
          <path d="M10 16V10M14 16V8M18 16V10M22 16V12" stroke="#F2994A" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M7 6L25 10" stroke="#1A5B4C" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
    case 'thali':
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none">
          <circle cx="16" cy="16" r="13" fill="#F2994A" />
          <circle cx="12" cy="12" r="3.5" fill="#FF5743" />
          <circle cx="20" cy="12" r="3.5" fill="#1A5B4C" />
          <circle cx="16" cy="21" r="4" fill="#FFFBF2" />
        </svg>
      );
    case 'dessert':
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none">
          <path d="M8 24L10 14L22 14L24 24H8Z" fill="#F2994A" />
          <path d="M10 14C10 14 12 11 16 11C20 11 22 14 22 14" stroke="#FF5743" strokeWidth="3" />
          <circle cx="16" cy="8" r="3" fill="#FF5743" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none">
          <circle cx="16" cy="16" r="12" fill="#FF5743" />
        </svg>
      );
  }
};
