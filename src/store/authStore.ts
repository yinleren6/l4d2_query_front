// src/store/authStore.ts
import { create } from 'zustand'
import { User } from '@/types'

interface AuthState {
    user: User | null
    setUser: (user: User) => void
    logout: () => void
}

// 安全地从 localStorage 读取用户数据
const getStoredUser = (): User | null => {
    const userStr = localStorage.getItem('user')
    if (!userStr) return null
    try {
        return JSON.parse(userStr) as User
    } catch (err) {
        console.error('解析 localStorage 用户数据失败', err)
        // 清除损坏的数据
        localStorage.removeItem('user')
        return null
    }
}

export const useAuthStore = create<AuthState>((set) => ({
    user: getStoredUser(),

    setUser: (user: User) => {
        try {
            localStorage.setItem('user', JSON.stringify(user))
        } catch (err) {
            console.error('localStorage 写入失败', err)
            // 存储失败时不影响内存状态，可考虑提示用户
        }
        set({ user })
    },

    logout: () => {
        localStorage.removeItem('user')
        set({ user: null })
        // 注意：不再在这里进行 window.location.href 跳转，
        // 调用方应使用 React Router 的 navigate 进行客户端路由跳转
    },
}))