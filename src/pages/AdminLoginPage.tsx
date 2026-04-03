// pages/AdminLoginPage.tsx
import { useState } from 'react'
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

  // 管理员登录提交逻辑
  const handleAdminLogin = async (values: { id: string; password: string }) => {
    setLoading(true)
    try {
      const { data } = await request.post<{ userID: string; token: string ,role:string }>('/api/login', {
        userID: values.id.trim(),
        Password: values.password.trim(),
      })
      // 存储用户信息和token
      setUser({ id: data.userID, token: data.token ,role:data.role})
      toast.success('管理员登录成功')
      navigate('/')
    } catch (err: unknown) {
      let errorMsg = '登录失败，请检查账号密码'
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        errorMsg = err.response.data.error
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
        onSubmit={handleAdminLogin as (values: { [key: string]: string }) => Promise<void>}
        loading={loading}
      />
    </div>
  )
}