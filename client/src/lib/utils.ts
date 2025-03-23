import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat("en-US", options).format(num);
}

export function formatCurrency(amount: number, currency = "USD", maximumFractionDigits = 2): string {
  return formatNumber(amount, {
    style: "currency",
    currency,
    maximumFractionDigits,
  });
}

export function formatPercentage(percentage: number, maximumFractionDigits = 2): string {
  return formatNumber(percentage / 100, {
    style: "percent",
    maximumFractionDigits,
  });
}

export function shortenAddress(address: string, chars = 4): string {
  if (!address) return "";
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
}

export function formatDate(date: Date | string | number): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatTime(date: Date | string | number): string {
  const d = new Date(date);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function formatDateWithTime(date: Date | string | number): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}

export function getRelativeTimeString(date: Date | string | number): string {
  const time = new Date(date).getTime();
  const now = Date.now();
  const diff = now - time;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) return 'just now';
  if (minutes === 1) return '1 minute ago';
  if (minutes < 60) return `${minutes} minutes ago`;
  if (hours === 1) return '1 hour ago';
  if (hours < 24) return `${hours} hours ago`;
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  if (months === 1) return '1 month ago';
  if (months < 12) return `${months} months ago`;
  if (years === 1) return '1 year ago';
  return `${years} years ago`;
}

export function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function generateRandomData(numPoints: number, min: number, max: number): number[] {
  return Array.from({ length: numPoints }, () => min + Math.random() * (max - min));
}

export function generateDates(days: number): string[] {
  const dates = [];
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(formatDate(date));
  }
  return dates;
}

export function getTransactionTypeColor(type: string) {
  switch (type.toLowerCase()) {
    case 'buy':
      return 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-100';
    case 'sell':
      return 'bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-100';
    case 'swap':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-800/30 dark:text-purple-100';
    case 'deposit':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-100';
    case 'withdraw':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-800/30 dark:text-orange-100';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-100';
  }
}

export function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'completed':
      return 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-100';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-100';
    case 'failed':
      return 'bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-100';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-100';
  }
}

export function getFormattedAmount(amount: number, prefix: string = ''): string {
  return `${prefix}${formatNumber(Math.abs(amount))}`;
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
