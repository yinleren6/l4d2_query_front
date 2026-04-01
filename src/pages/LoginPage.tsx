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
  const navigate = useNavigate()
  const { setUser } = useAuthStore()

  const login = async () => {
    const { data } = await request.post('/login', { id, password: pwd })
    setUser(data)
    navigate('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <Card className="w-full max-w-md p-6 shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-6">管理员登录</h1>
        <div className="space-y-4">
          <Input value={id} onChange={e => setId(e.target.value)} placeholder="管理员ID" />
          <Input type="password" value={pwd} onChange={e => setPwd(e.target.value)} placeholder="密码" />
          <Button className="w-full" onClick={login}>登录</Button>
        </div>
      </Card>
    </div>
  )
}