import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatPercentage(percentage: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(percentage / 100);
}

export function shortenAddress(address: string, chars = 4): string {
  if (!address) return '';
  
  // If it's an ENS name, return as is
  if (address.endsWith('.eth')) {
    return address;
  }
  
  // Otherwise, shorten the address
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
}

export function getRandomColor(index: number): string {
  const colors = [
    'rgb(59, 130, 246)', // blue
    'rgb(16, 185, 129)', // green
    'rgb(239, 68, 68)',  // red
    'rgb(139, 92, 246)', // purple
    'rgb(245, 158, 11)', // yellow
    'rgb(14, 165, 233)', // sky
    'rgb(236, 72, 153)', // pink
    'rgb(168, 85, 247)', // violet
    'rgb(234, 88, 12)',  // orange
    'rgb(20, 184, 166)', // teal
  ];
  
  return colors[index % colors.length];
}

export function calculateProfitLoss(currentPrice: number, avgPrice: number, quantity: number): number {
  return (currentPrice - avgPrice) * quantity;
}

export function calculateProfitLossPercentage(currentPrice: number, avgPrice: number): number {
  if (avgPrice === 0) return 0;
  return ((currentPrice - avgPrice) / avgPrice) * 100;
}
