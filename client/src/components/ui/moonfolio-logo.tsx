import React from 'react';
import { cn } from '@/lib/utils';

interface MoonfolioLogoProps {
  variant?: 'default' | 'icon';
  className?: string;
}

export function MoonfolioLogo({
  variant = 'default',
  className,
}: MoonfolioLogoProps) {
  // Mezzaluna elegante e moderna
  if (variant === 'icon') {
    return (
      <div className={cn('inline-flex items-center justify-center', className)}>
        <svg 
          width="80" 
          height="80" 
          viewBox="0 0 80 80" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="h-9 w-9"
        >
          <circle cx="40" cy="40" r="36" fill="url(#gradient_moon)" />
          <path 
            d="M52 20C65.8 26.5 72 42.5 65.5 56.5C59 70.5 43 76.5 29 70C44.5 73.5 59.5 63.5 63 47.5C66.5 31.5 56.5 20 52 20Z" 
            fill="white" 
            fillOpacity="0.85"
          />
          <defs>
            <linearGradient id="gradient_moon" x1="15" y1="15" x2="65" y2="65" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0066FF" />
              <stop offset="1" stopColor="#004CBA" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }

  return (
    <div className={cn('inline-flex items-center', className)}>
      <svg 
        width="80" 
        height="80" 
        viewBox="0 0 80 80" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="h-7 w-7 mr-2"
      >
        <circle cx="40" cy="40" r="36" fill="url(#gradient_moon_full)" />
        <path 
          d="M52 20C65.8 26.5 72 42.5 65.5 56.5C59 70.5 43 76.5 29 70C44.5 73.5 59.5 63.5 63 47.5C66.5 31.5 56.5 20 52 20Z" 
          fill="white" 
          fillOpacity="0.85"
        />
        <defs>
          <linearGradient id="gradient_moon_full" x1="15" y1="15" x2="65" y2="65" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0066FF" />
            <stop offset="1" stopColor="#004CBA" />
          </linearGradient>
        </defs>
      </svg>
      <span className="font-bold text-xl">Moonfolio</span>
    </div>
  );
}