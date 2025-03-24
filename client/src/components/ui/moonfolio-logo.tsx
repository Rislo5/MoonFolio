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
  // Mezzaluna piena blu
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
          <rect width="80" height="80" rx="16" fill="#0055FF" fillOpacity="0.1"/>
          <path d="M40 70C56.5685 70 70 56.5685 70 40C70 23.4315 56.5685 10 40 10C23.4315 10 10 23.4315 10 40C10 56.5685 23.4315 70 40 70Z" fill="#0055FF"/>
          <path d="M50 25C42.5 25 36.5 30 33 36C36.5 32 42 30 46.5 30C55.6127 30 63 37.3873 63 46.5C63 51 61 55.5 57 59C63 54.5 66.5 48 66.5 40.5C66.5 31.9396 59.0604 25 50 25Z" fill="white"/>
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
        <rect width="80" height="80" rx="16" fill="#0055FF" fillOpacity="0.1"/>
        <path d="M40 70C56.5685 70 70 56.5685 70 40C70 23.4315 56.5685 10 40 10C23.4315 10 10 23.4315 10 40C10 56.5685 23.4315 70 40 70Z" fill="#0055FF"/>
        <path d="M50 25C42.5 25 36.5 30 33 36C36.5 32 42 30 46.5 30C55.6127 30 63 37.3873 63 46.5C63 51 61 55.5 57 59C63 54.5 66.5 48 66.5 40.5C66.5 31.9396 59.0604 25 50 25Z" fill="white"/>
      </svg>
      <span className="font-bold text-xl">Moonfolio</span>
    </div>
  );
}