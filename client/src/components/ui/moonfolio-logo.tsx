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
  // Utilizziamo l'icona della mezzaluna fornita dall'utente
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
          <path
            d="M71.5 40C71.5 57.397 57.397 71.5 40 71.5C22.603 71.5 8.5 57.397 8.5 40C8.5 22.603 22.603 8.5 40 8.5C57.397 8.5 71.5 22.603 71.5 40Z"
            fill="url(#paint0_linear_111_1501)"
            stroke="#0066FF"
          />
          <path
            d="M45.0518 29C40.4692 29 36.3193 31.318 34 34.982C36.0061 32.2551 39.3584 30.4827 43.1346 30.4827C49.3756 30.4827 54.4307 35.5377 54.4307 41.7787C54.4307 45.5549 52.6583 48.9073 49.9315 50.9133C53.5958 48.594 55.914 44.4442 55.914 39.8615C55.914 33.8351 51.0782 29 45.0518 29Z"
            fill="white"
          />
          <defs>
            <linearGradient
              id="paint0_linear_111_1501"
              x1="71"
              y1="72"
              x2="8"
              y2="8"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#0045B5"/>
              <stop offset="1" stopColor="#0070FF"/>
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
        <path
          d="M71.5 40C71.5 57.397 57.397 71.5 40 71.5C22.603 71.5 8.5 57.397 8.5 40C8.5 22.603 22.603 8.5 40 8.5C57.397 8.5 71.5 22.603 71.5 40Z"
          fill="url(#paint0_linear_111_1501)"
          stroke="#0066FF"
        />
        <path
          d="M45.0518 29C40.4692 29 36.3193 31.318 34 34.982C36.0061 32.2551 39.3584 30.4827 43.1346 30.4827C49.3756 30.4827 54.4307 35.5377 54.4307 41.7787C54.4307 45.5549 52.6583 48.9073 49.9315 50.9133C53.5958 48.594 55.914 44.4442 55.914 39.8615C55.914 33.8351 51.0782 29 45.0518 29Z"
          fill="white"
        />
        <defs>
          <linearGradient
            id="paint0_linear_111_1501"
            x1="71"
            y1="72"
            x2="8"
            y2="8"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#0045B5"/>
            <stop offset="1" stopColor="#0070FF"/>
          </linearGradient>
        </defs>
      </svg>
      <span className="font-bold text-xl">Moonfolio</span>
    </div>
  );
}