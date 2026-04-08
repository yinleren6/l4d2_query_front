import axios from 'axios'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/AuthState'

const request = axios.create({ baseURL: '/' })

// 自动刷新锁，防止重复刷新
let isRefreshing = false
let failedQueue: any[] = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error)
    else prom.resolve(token)
  })
  failedQueue = []
}

// 请求拦截器：携带 Token
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

// 响应拦截器 + 无感自动续期
request.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalConfig = err.config

    // 非401直接报错
    if (err.response?.status !== 401 || originalConfig._retry) {
      if (err.response?.status === 403) toast.error('无权限访问该功能')
      else if (err.response?.status >= 500) toast.error('服务器错误')
      return Promise.reject(err)
    }

    // 获取用户 & refreshToken
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

    // 如果正在刷新，把请求加入队列
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
      // 调用刷新接口
      const { data } = await axios.post('/api/refresh-token', {
        refreshToken: refreshToken
      })

      // 刷新成功 → 更新本地用户信息
      const newUser = {
        ...user,
        token: data.accessToken,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken
      }

      localStorage.setItem('user', JSON.stringify(newUser))
      useAuthStore.getState().setUser(newUser)
      processQueue(null, data.accessToken)

      // 重新执行失败的请求
      originalConfig.headers.Authorization = `Bearer ${data.accessToken}`
      return request(originalConfig)

    } catch (refreshError) {
      // 刷新失败 → 退出登录
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