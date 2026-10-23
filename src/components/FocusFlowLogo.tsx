import React from 'react';

interface FocusFlowLogoProps {
  className?: string;
  size?: number;
}

export const FocusFlowLogo: React.FC<FocusFlowLogoProps> = ({ 
  className = "w-9 h-9",
  size = 36
}) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 48 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="FocusFlow AI Logo"
      role="img"
    >
      <defs>
        <linearGradient id="ff-grad-primary" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366F1" />
          <stop offset="0.5" stopColor="#818CF8" />
          <stop offset="1" stopColor="#06B6D4" />
        </linearGradient>
        <linearGradient id="ff-grad-glow" x1="12" y1="24" x2="36" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38BDF8" />
          <stop offset="1" stopColor="#818CF8" />
        </linearGradient>
      </defs>

      {/* Rounded subtle container */}
      <rect width="48" height="48" rx="12" fill="#0E1628" stroke="#1E293B" strokeWidth="1.5" />

      {/* Outer focus target ring with precision notches */}
      <circle 
        cx="24" 
        cy="24" 
        r="15" 
        stroke="url(#ff-grad-primary)" 
        strokeWidth="2.2" 
        strokeDasharray="6 2.5" 
        strokeLinecap="round" 
      />

      {/* Dynamic flow wave/synapse loop */}
      <path 
        d="M16 26.5C18.5 21 21.5 21 24 24C26.5 27 29.5 27 32 21.5" 
        stroke="url(#ff-grad-glow)" 
        strokeWidth="2.4" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />

      {/* Core focus aperture node */}
      <circle cx="24" cy="24" r="3.5" fill="#06B6D4" />
      <circle cx="24" cy="24" r="1.5" fill="#FFFFFF" />
    </svg>
  );
};
