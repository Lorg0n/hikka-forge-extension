import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Helper for Ukrainian pluralization
  const getPlural = (number: number, one: string, few: string, many: string) => {
    const n = Math.abs(number);
    if (n % 10 === 1 && n % 100 !== 11) {
      return one;
    }
    if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) {
      return few;
    }
    return many;
  };

  let interval = seconds / 31536000;
  if (interval > 1) {
    const years = Math.floor(interval);
    return `${years} ${getPlural(years, 'рік', 'роки', 'років')} тому`;
  }
  interval = seconds / 2592000;
  if (interval > 1) {
    const months = Math.floor(interval);
    return `${months} ${getPlural(months, 'місяць', 'місяці', 'місяців')} тому`;
  }
  interval = seconds / 86400;
  if (interval > 1) {
    const days = Math.floor(interval);
    return `${days} ${getPlural(days, 'день', 'дні', 'днів')} тому`;
  }
  interval = seconds / 3600;
  if (interval > 1) {
    const hours = Math.floor(interval);
    return `${hours} ${getPlural(hours, 'годину', 'години', 'годин')} тому`;
  }
  interval = seconds / 60;
  if (interval > 1) {
    const minutes = Math.floor(interval);
    return `${minutes} ${getPlural(minutes, 'хвилину', 'хвилини', 'хвилин')} тому`;
  }
  return 'Щойно';
}
