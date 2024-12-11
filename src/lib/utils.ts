import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number) {
  // examples: 50k, 52.4m, 1.2b
  if (price < 1000) {
    return price.toFixed(2);
  } else if (price < 1000000) {
    return (price / 1000).toFixed(2) + "k";
  } else if (price < 1000000000) {
    return (price / 1000000).toFixed(2) + "m";
  } else {
    return (price / 1000000000).toFixed(2) + "b";
  }
}