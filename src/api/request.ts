import axios from 'axios'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/AuthState'
const API_HOST = import.meta.env.VITE_API_HOST
const request = axios.create({ baseURL: API_HOST })

let isRefreshing = false
let failedQueue: any[] = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error)
    else prom.resolve(token)
  })
  failedQueue = []
}

request.interceptors.request.use(
  (config) => {
    config.headers = config.headers || {}
    delete config.headers.Authorization

    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        const token = user.jwtToken || user.accessToken
        if (token && typeof token === 'string' && token.trim()) {
          config.headers.Authorization = `Bearer ${token}`
        } else {
          localStorage.removeItem('user')
        }
      } catch (e) {
        console.error('Token 解析失败', e)
        localStorage.removeItem('user')
      }
    }
    return config
  },
  (err) => Promise.reject(err)
)

request.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalConfig = err.config

    if (err.response?.status !== 401 || originalConfig._retry) {
      if (err.response?.status === 403) toast.error('无权限访问该功能')
      else if (err.response?.status >= 500) toast.error('服务器错误')
      return Promise.reject(err)
    }

    const userStr = localStorage.getItem('user')
    if (!userStr) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
      return Promise.reject(err)
    }

    const user = JSON.parse(userStr)
    const refreshToken = user.refreshToken
    if (!refreshToken) {
      toast.error('登录已失效，请重新登录')
      useAuthStore.getState().logout()
      window.location.href = '/login'
      return Promise.reject(err)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      })
        .then(token => {
          originalConfig.headers.Authorization = `Bearer ${token}`
          return request(originalConfig)
        })
        .catch(err => Promise.reject(err))
    }

    originalConfig._retry = true
    isRefreshing = true

    try {
      const { data } = await axios.post('/api/refresh-token', {
        refreshToken: refreshToken
      })
      const newUser = {
        ...user,
        token: data.accessToken,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken
      }

      localStorage.setItem('user', JSON.stringify(newUser))
      useAuthStore.getState().setUser(newUser)
      processQueue(null, data.accessToken)

      originalConfig.headers.Authorization = `Bearer ${data.accessToken}`
      return request(originalConfig)

    } catch (refreshError) {
      processQueue(refreshError, null)
      toast.error('登录已过期，请重新登录')
      useAuthStore.getState().logout()
      window.location.href = '/login'
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export default request