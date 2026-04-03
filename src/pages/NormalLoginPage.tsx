// pages/NormalLoginPage.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import request from '@/api/request'
import { toast } from 'sonner'
import axios from 'axios'
import LoginForm from '@/components/LoginForm'

export default function NormalLoginPage() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { setUser } = useAuthStore()

  // Token登录提交逻辑
  const handleTokenLogin = async (values: { token: string }) => {
    setLoading(true)
    try {
      // 假设后端提供Token登录接口，需根据实际接口调整
      const { data } = await request.post<{ userID: string; token: string ,role:string }>('/api/login-by-token', {
        token: values.token.trim(),
      })
      // 存储用户信息和token
      setUser({ id: data.userID, token: data.token ,role:data.role})
      toast.success('Token登录成功')
      navigate('/')
    } catch (err: unknown) {
      let errorMsg = 'Token登录失败，请检查Token是否有效'
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
        type="token"
        onSubmit={handleTokenLogin as (values: { [key: string]: string }) => Promise<void>}
        loading={loading}
      />
    </div>
  )
}