import axios from 'axios'

const API_BASE_URL = import.meta.env.DEV ? '' : 'https://version.us.ci'

const request = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 15000,
})

// 请求拦截：自动添加 Bearer Token
request.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// 响应拦截：401 自动跳登录
request.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            localStorage.clear()
            window.location.href = '/login'
        }
        return Promise.reject(err)
    }
)

export default request