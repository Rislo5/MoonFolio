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
  // Utilizziamo il componente SVG originale 
  if (variant === 'icon') {
    return (
      <div className={cn('inline-flex items-center justify-center', className)}>
        <svg
          className="h-9 w-9"
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M18 36C27.9411 36 36 27.9411 36 18C36 8.05887 27.9411 0 18 0C8.05887 0 0 8.05887 0 18C0 27.9411 8.05887 36 18 36Z"
            fill="currentColor"
            fillOpacity="0.16"
          />
          <path
            d="M18 30C24.6274 30 30 24.6274 30 18C30 11.3726 24.6274 6 18 6C11.3726 6 6 11.3726 6 18C6 24.6274 11.3726 30 18 30Z"
            fill="currentColor"
            fillOpacity="0.24"
          />
          <path
            d="M25.9045 13.5C25.9045 18.1944 22.1035 22 17.4523 22C12.8011 22 9 18.1944 9 13.5C9 8.80558 12.8011 5 17.4523 5C22.1035 5 25.9045 8.80558 25.9045 13.5Z"
            fill="currentColor"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className={cn('inline-flex items-center', className)}>
      <svg
        className="h-7 w-7 mr-2"
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M18 36C27.9411 36 36 27.9411 36 18C36 8.05887 27.9411 0 18 0C8.05887 0 0 8.05887 0 18C0 27.9411 8.05887 36 18 36Z"
          fill="currentColor"
          fillOpacity="0.16"
        />
        <path
          d="M18 30C24.6274 30 30 24.6274 30 18C30 11.3726 24.6274 6 18 6C11.3726 6 6 11.3726 6 18C6 24.6274 11.3726 30 18 30Z"
          fill="currentColor"
          fillOpacity="0.24"
        />
        <path
          d="M25.9045 13.5C25.9045 18.1944 22.1035 22 17.4523 22C12.8011 22 9 18.1944 9 13.5C9 8.80558 12.8011 5 17.4523 5C22.1035 5 25.9045 8.80558 25.9045 13.5Z"
          fill="currentColor"
        />
      </svg>
      <span className="font-bold text-xl">Moonfolio</span>
    </div>
  );
}