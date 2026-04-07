// src/api/request.ts
import axios from 'axios'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore';
const request = axios.create({ baseURL: '/' })

// 请求拦截器：携带 Token
request.interceptors.request.use(
  (config) => {
    // 1. 确保 headers 对象存在
    config.headers = config.headers || {}
    // 清空旧 Authorization，避免重复或错误值
    delete config.headers.Authorization

    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        // 2. 兼容 token 字段名（根据实际后端调整）
        const token = user.token || user.accessToken
        // 3. 校验 token 是否为非空字符串
        if (token && typeof token === 'string' && token.trim()) {
          config.headers.Authorization = `Bearer ${token}`
        } else {
          // 无效 token，清除 localStorage 避免反复解析
          localStorage.removeItem('user')
        }
      } catch (e) {
        console.error('Token 解析失败', e)
        // 解析失败说明 user 数据损坏，清除
        localStorage.removeItem('user')
      }
    }
    return config
  },
  (err) => Promise.reject(err)
)

// 响应拦截器：统一错误处理
request.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response) {
      const { status } = err.response
      if (status === 401) {
        toast.error('登录态失效，请重新登录');
        useAuthStore.getState().logout(); // 同步清除 store
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      } else if (status === 403) {
        toast.error('无权限访问该功能')
      } else if (status >= 500) {
        toast.error('服务器错误，请稍后重试')
      } else {
        // 其他客户端错误（400, 404 等）可选提示，由调用方处理更合适
        // 这里不自动 toast，避免重复提示
      }
    } else if (err.code === 'ECONNABORTED' || err.message?.includes('Network Error')) {
      toast.error('网络连接失败，请检查网络')
    } else {
      // 未知错误
      console.error('请求异常', err)
      toast.error('请求失败，请重试')
    }
    return Promise.reject(err)
  }
)

export default request