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

    setUser: (user) => {
        localStorage.setItem('user', JSON.stringify(user))
        localStorage.setItem('token', user.token)
        set({ user })
    },

    logout: () => {
        localStorage.clear()
        set({ user: null })
        window.location.href = '/login'
    },
}))