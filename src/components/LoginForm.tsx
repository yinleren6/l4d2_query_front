// components/LoginForm.tsx
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'

// 定义组件Props类型
interface LoginFormProps {
  type: 'admin' | 'token' // 登录类型：管理员/普通token登录
  onSubmit: (values: { [key: string]: string }) => Promise<void> // 提交回调
  loading: boolean // 加载状态
}

export default function LoginForm({ type, onSubmit, loading }: LoginFormProps) {
  // 根据登录类型初始化表单值
  const [formValues, setFormValues] = useState<{
    id?: string
    password?: string
    token?: string
  }>(() => {
    if (type === 'admin') return { id: '', password: '' }
    return { token: '' }
  })

  // 输入框变更处理
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string
  ) => {
    setFormValues(prev => ({ ...prev, [field]: e.target.value }))
  }

  // 表单提交处理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 表单验证
    if (type === 'admin') {
      if (!formValues.id?.trim() || !formValues.password?.trim()) {
        toast.error('请输入管理员ID和密码')
        return
      }
    } else {
      if (!formValues.token?.trim()) {
        toast.error('请输入登录Token')
        return
      }
    }

    // 调用外部提交逻辑
    await onSubmit(formValues)
  }

  // 回车登录处理
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  return (
    <Card className="w-full max-w-md p-6 shadow-lg">
      <h1 className="text-2xl font-bold text-center mb-6">
        {type === 'admin' ? '管理后台登录' : '普通用户Token登录'}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 管理员登录 - ID输入框 */}
        {type === 'admin' && (
          <Input
            value={formValues.id}
            onChange={(e) => handleInputChange(e, 'id')}
            placeholder="管理员ID"
            disabled={loading}
            onKeyDown={handleKeyDown}
          />
        )}

        {/* 管理员登录 - 密码输入框 / 普通登录 - Token输入框 */}
        <Input
          type={type === 'admin' ? 'password' : 'text'}
          value={type === 'admin' ? formValues.password : formValues.token}
          onChange={(e) => handleInputChange(e, type === 'admin' ? 'password' : 'token')}
          placeholder={type === 'admin' ? '密码' : '登录Token'}
          disabled={loading}
          onKeyDown={handleKeyDown}
        />

        <Button
          className="w-full"
          type="submit"
          disabled={loading}
        >
          {loading ? '登录中...' : '登录'}
        </Button>
      </form>
    </Card>
  )
}