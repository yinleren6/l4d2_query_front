import { useEffect, useState } from 'react'
import request from '@/api/request'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

export default function WhitelistPage() {
  const [list, setList] = useState([])
  const [userId, setUserId] = useState('')

  const load = () => request.get('/whitelist').then(res => setList(res.data))
  useEffect(() => load(), [])

  const add = () => {
    request.post('/whitelist', { user_id: userId }).then(() => {
      setUserId('')
      load()
    })
  }

  const del = (id: string) => {
    request.delete(`/whitelist/${id}`).then(load)
  }

  return (
    <Card className="p-4">
      <h2 className="text-xl mb-4">用户白名单</h2>
      <div className="flex gap-2 mb-4">
        <Input value={userId} onChange={e => setUserId(e.target.value)} placeholder="用户ID" />
        <Button onClick={add}>添加</Button>
      </div>
      <div className="space-y-2">
        {list.map((item: any) => (
          <div key={item.user_id} className="flex justify-between p-2 border rounded">
            <span>{item.user_id}</span>
            <Button variant="destructive" onClick={() => del(item.user_id)}>删除</Button>
          </div>
        ))}
      </div>
    </Card>
  )
}