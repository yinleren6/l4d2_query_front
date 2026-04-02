import axios from 'axios'
import { toast } from 'sonner'

const request = axios.create({
    baseURL: "",
    timeout: 10000,
})

// 请求拦截器：自动携带 Token
request.interceptors.request.use(
    (config) => {
        const userStr = localStorage.getItem('user')
        if (userStr) {
            try {
                const user = JSON.parse(userStr)
                if (user && user.token) {
                    config.headers.Authorization = `Bearer ${user.token}`
                }
            } catch (e) {
                console.error('解析用户信息失败', e)
            }
        }
        return config
    },
    (error) => Promise.reject(error)
)

// 响应拦截器：统一处理错误
request.interceptors.response.use(
    (res) => res,
    (error) => {
        if (error.response?.status === 401) {
            toast.error('登录已过期，请重新登录')
            // 清除用户信息
            localStorage.removeItem('user')
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

export default request