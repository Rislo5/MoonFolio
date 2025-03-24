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
  const logoPath = '/images/moonfolio-logo.png';

  if (variant === 'icon') {
    return (
      <div className={cn('inline-flex items-center justify-center', className)}>
        <img
          src={logoPath}
          alt="Moonfolio"
          className="h-full w-auto"
        />
      </div>
    );
  }

  return (
    <div className={cn('inline-flex items-center', className)}>
      <img
        src={logoPath}
        alt="Moonfolio"
        className="h-full w-auto mr-2"
      />
      <span className="font-bold text-xl">Moonfolio</span>
    </div>
  );
}