import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import request from '@/api/request'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

import { toast } from 'sonner'
import axios from 'axios';
export default function LoginPage() {

  const [id, setId] = useState('')
  const [password, setPwd] = useState('')

  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { setUser } = useAuthStore()

  const login = async () => {
    if (!id.trim() || !password.trim()) {
        toast.error('请输入账号和密码');
        return;
    }
    setLoading(true);
    try {
        const { data } = await request.post<{ userID: string, token: string  }>('/api/login', {
            userID: id.trim(),
            Password: password.trim(),
        });
        setUser({ id: data.userID, token: data.token });
        navigate('/');
    } catch (err: unknown) {
        let errorMsg = '登录失败，请检查账号密码';
        if (axios.isAxiosError(err) && err.response?.data?.error) {
            errorMsg = err.response.data.error;
        }
        toast.error(`${errorMsg}`);
    } finally {
        setLoading(false);
    }
};

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
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPwd(e.target.value)}
            placeholder="密码"
            disabled={loading}
            onKeyDown={(e) => e.key === 'Enter' && login()} // 回车登录
          />
          <Button className="w-full" onClick={( )=>{login( )}} disabled={loading} type="button">
            {loading ? '登录中...' : '登录'}
          </Button>
        </div>
      </Card>
    </div>
  )
}