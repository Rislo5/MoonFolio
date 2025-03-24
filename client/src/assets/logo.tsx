import React from "react";

export const MoonfolioLogo: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 300 300" 
      className={className}
      role="img"
      aria-label="Moonfolio logo"
    >
      <defs>
        <linearGradient id="moonfolio-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: "#1e3a8a" }} />
          <stop offset="100%" style={{ stopColor: "#0c0c30" }} />
        </linearGradient>
      </defs>
      <rect width="300" height="300" fill="url(#moonfolio-gradient)" />
      <path
        d="M150 60 A90 90 0 1 0 215 95 A65 65 0 0 1 150 60"
        fill="white"
      />
    </svg>
  );
};

export const MoonfolioMoonIcon: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 100 100" 
      className={className}
      role="img"
      aria-label="Moonfolio moon icon"
    >
      <path
        d="M50 10 A40 40 0 1 0 85 35 A30 30 0 0 1 50 10"
        fill="currentColor"
      />
    </svg>
  );
};

export const MoonfolioTextIcon: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 200 40" 
      className={className}
      role="img"
      aria-label="Moonfolio text logo"
    >
      <text
        x="0"
        y="30"
        fontFamily="Arial, sans-serif"
        fontSize="24"
        fontWeight="bold"
        fill="currentColor"
      >
        Moonfolio
      </text>
    </svg>
  );
};

export default MoonfolioLogo;