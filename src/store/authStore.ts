import { create } from 'zustand'
import { User } from '@/types'

interface AuthState {
    user: User | null
    setUser: (user: User) => void
    logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
    user: localStorage.getItem('user')
        ? JSON.parse(localStorage.getItem('user')!)
        : null,

    setUser: (user: User) => {
        console.log('setUser 接收到的 user:', user)
        try {
            localStorage.setItem('user', JSON.stringify(user))
        } catch (err) {
            console.error('localStorage 写入失败', err)
        }
        set({ user })
    },

    logout: () => {
        localStorage.removeItem('user')
        set({ user: null })
        window.location.href = '/login'
    },
}))