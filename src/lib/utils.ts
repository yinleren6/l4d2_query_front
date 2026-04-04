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
