import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import request from '@/api/request'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'


export default function LoginPage() {
  const [id, setId] = useState('')
  const [pwd, setPwd] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { setUser } = useAuthStore()
  // 定义响应类型
  interface LoginResponse {
    token: string
    userID: string
  }
  const login = async () => {
    if (!id.trim() || !pwd.trim()) {
      alert('请输入账号和密码')
      return
    }
    setLoading(true)
    try {

        // 在请求时指定类型
        const { data } = await request.post<LoginResponse>('/api/login', {
          id: id.trim(),
          token: pwd.trim(),
        })
        setUser({ id: data.userID, token: data.token })
      navigate('/')
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || '登录失败，请检查账号密码'
      alert(`登录失败: ${errorMsg}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
      <Card className="w-full max-w-md p-6 shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-6">管理后台登录</h1>
        <div className="space-y-4">
          <Input
            value={id}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setId(e.target.value)}
            placeholder="管理员ID"
            disabled={loading}
          />
          <Input
            type="password"
            value={pwd}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPwd(e.target.value)}
            placeholder="密码"
            disabled={loading}
          />
          <Button className="w-full" onClick={login} disabled={loading}>
            {loading ? '登录中...' : '登录'}
          </Button>
        </div>
      </Card>
    </div>
  )
}