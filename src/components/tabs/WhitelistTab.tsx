import { useState,useEffect } from 'react'
import request from '@/api/request'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { WhitelistItem } from '@/types'

export default function WhitelistTab() {
  const [list, setList] = useState<WhitelistItem[]>([])
  const [userId, setUserId] = useState('')

  // 加载白名单
  const loadWhitelist = async () => {
    try {
      const res = await request.get('/api/whitelist')
      setList(res.data)
    } catch (err: any) {
      if (err.response?.status === 403) {
        alert('无权限查看白名单')
      } else {
        console.error('加载白名单失败:', err)
      }
    }
  }



  // 添加白名单
  const addWhitelist = async () => {
    if (!userId.trim()) {
      alert('请输入用户ID')
      return
    }
    try {
      await request.post('/api/whitelist', { user_id: userId.trim() })
      setUserId('')
      loadWhitelist()
    } catch (err) {
      console.error('添加失败:', err)
      alert('添加失败')
    }
  }
  useEffect(() => {
    const fetchData = async () => {
      await loadWhitelist()
    }
    fetchData()
  }, [])
  // 删除白名单
  const removeWhitelist = async (user_id: string) => {
    if (confirm(`确定删除用户 ${user_id} 吗？`)) {
      try {
        await request.delete(`/api/whitelist/${user_id}`)
        loadWhitelist()
      } catch (err) {
        console.error('删除失败:', err)
        alert('删除失败')
      }
    }
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">用户白名单</h2>
      <div className="flex gap-2 mb-4">
        <Input
          value={userId}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserId(e.target.value)}
          placeholder="输入用户ID"
        />
        <Button onClick={addWhitelist}>添加</Button>
      </div>
      <div className="space-y-2">
        {list.map((item) => (
          <div key={item.user_id} className="flex justify-between p-3 border rounded-lg">
            <div>
              <span className="font-medium">{item.user_id}</span>
              <p className="text-sm text-slate-500">添加时间: {item.added_at}</p>
            </div>
            <Button variant="destructive" size="sm" onClick={() => removeWhitelist(item.user_id)}>
              删除
            </Button>
          </div>
        ))}
      </div>
    </Card>
  )
}