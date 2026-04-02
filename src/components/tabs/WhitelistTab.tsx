// WhitelistTab.tsx - 适配后端 /api/admin/groups 接口
import { useState, useEffect } from 'react'
import request from '@/api/request'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { WhitelistItem } from '@/types'
import { toast } from 'sonner'

export default function WhitelistTab() {
  const [list, setList] = useState<WhitelistItem[]>([])
  const [groupId, setGroupId] = useState('')

  const loadWhitelist = async (signal?: AbortSignal) => {
    try {
      const res = await request.get('/api/admin/groups', { signal })
      // 后端返回 [{ group_id, enabled, added_at }]
      setList(res.data)
    } catch (err: any) {
      if (err.name === 'AbortError') return
      if (err.response?.status === 403) {
        toast.error('无权限查看白名单')
      } else {
        console.error('加载白名单失败:', err)
        toast.error('加载白名单失败')
      }
    }
  }

  useEffect(() => {
    const controller = new AbortController()
     loadWhitelist(controller.signal)
    return () => controller.abort()
  }, [])

  const addWhitelist = async () => {
    const id = groupId.trim()
    if (!id) {
      toast.error('请输入群组ID')
      return
    }
    if (list.some(item => item.group_id === id)) {
      toast.warning('该群组已在白名单中')
      return
    }
    try {
      await request.post('/api/admin/groups', { group_id: id })
      setGroupId('')
      toast.success('添加成功')
      await loadWhitelist()
    } catch (err: any) {
      console.error('添加失败:', err)
      toast.error(err.response?.data?.error || '添加失败')
    }
  }

  const toggleEnable = async (groupId: string, currentlyEnabled: boolean) => {
    try {
      await request.patch(`/api/admin/groups/${groupId}/enabled`, { enabled: !currentlyEnabled })
      toast.success(currentlyEnabled ? '已禁用' : '已启用')
      await loadWhitelist()
    } catch (err: any) {
      console.error('状态切换失败:', err)
      toast.error(err.response?.data?.error || '操作失败')
    }
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">群组白名单</h2>
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <Input
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
          placeholder="输入群组ID"
          onKeyDown={(e) => e.key === 'Enter' && addWhitelist()}
          className="flex-1"
        />
        <Button onClick={addWhitelist} className="sm:w-auto w-full">添加群组</Button>
      </div>
      <div className="space-y-2">
        {list.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            暂无白名单群组，添加后将显示在此处
          </div>
        ) : (
          list.map((item) => (
            <div key={item.group_id} className="flex flex-col sm:flex-row justify-between items-center p-3 border rounded-lg gap-2">
              <div className="flex-1">
                <span className="font-medium">{item.group_id}</span>
                <p className="text-sm text-slate-500 dark:text-slate-400">添加时间: {item.added_at}</p>
                <p className="text-xs mt-1">
                  状态: {item.enabled ? <span className="text-green-600">已启用</span> : <span className="text-red-600">已禁用</span>}
                </p>
              </div>
              <Button
                variant={item.enabled ? "destructive" : "default"}
                size="sm"
                onClick={() => toggleEnable(item.group_id, item.enabled)}
              >
                {item.enabled ? '禁用' : '启用'}
              </Button>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}