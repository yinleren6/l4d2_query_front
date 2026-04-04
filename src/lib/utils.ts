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
export const formatTime = () => {
    const now = new Date()
    const pad = (num: number) => num.toString().padStart(2, '0')
    const year = pad(now.getFullYear() % 100)
    const month = pad(now.getMonth() + 1)
    const day = pad(now.getDate())
    const hour = pad(now.getHours())
    const minute = pad(now.getMinutes())
    return year + month + day + hour + minute
}