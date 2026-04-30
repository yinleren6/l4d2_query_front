import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export const deepTrim = (obj: any): any => {
  if (typeof obj === 'string') {
    return obj.trim()
  }
  if (Array.isArray(obj)) {
    return obj.map(deepTrim)
  }
  if (obj !== null && typeof obj === 'object') {
    const trimmedObj: any = {}
    for (const key in obj) {
      trimmedObj[key] = deepTrim(obj[key])
    }
    return trimmedObj
  }
  return obj
}
export const isEqual = (obj1: any, obj2: any): boolean => {
  return JSON.stringify(obj1) === JSON.stringify(obj2)
}

export function timeAgo(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000) - timestamp;
  if (seconds < 60) return "刚刚";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  return `${days}天前`;
}

export function formatAbsoluteTime(timestamp: number): string {
  if (!timestamp) return "";
  const date = new Date(timestamp * 1000);
  return date.toLocaleString(); // 自动使用浏览器语言和时区
}

