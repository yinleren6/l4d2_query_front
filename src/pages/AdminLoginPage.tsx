// src/pages/AdminLoginPage.tsx
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import request from '@/api/request'
import { toast } from 'sonner'
import axios from 'axios'
import LoginForm from '@/components/LoginForm'

export default function AdminLoginPage() {
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()
    const { setUser } = useAuthStore()
    const abortControllerRef = useRef<AbortController | null>(null)
    const mountedRef = useRef(true)
    useEffect(() => {
        mountedRef.current = true
        return () => {
            abortControllerRef.current?.abort()
        }
    }, [])

    // 修改参数类型为通用 Record<string, string>
    const handleAdminLogin = async (values: Record<string, string>) => {
        const id = values.id
        const password = values.password

        if (!id || !password) {
            toast.error('管理员ID和密码不能为空')
            return
        }

        abortControllerRef.current?.abort()
        const controller = new AbortController()
        abortControllerRef.current = controller

        setLoading(true)
        try {
            const { data } = await request.post<{
                userID: string
                token: string
                role: string
            }>(
                '/api/login',
                {
                    userID: id.trim(),
                    Password: password.trim(),
                },
                { signal: controller.signal },
            )

            setUser({ id: data.userID, token: data.token, role: data.role })
            toast.success('管理员登录成功')
            navigate('/dashboard/overview')
        } catch (err) {
            if (axios.isCancel(err) || (err as Error).name === 'AbortError') {
                return
            }
            let errorMsg = '登录失败，请检查账号密码'
            if (axios.isAxiosError(err)) {
                if (err.response?.data?.error) {
                    errorMsg = err.response.data.error
                } else if (!err.response) {
                    errorMsg = '网络连接失败，请检查网络'
                }
            }
            toast.error(errorMsg)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
            <LoginForm
                type="admin"
                onSubmit={handleAdminLogin} // 现在类型完全匹配
                loading={loading}
            />
        </div>
    )
}
