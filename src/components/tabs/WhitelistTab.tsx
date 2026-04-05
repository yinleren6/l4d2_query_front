// src/components/tabs/WhitelistTab.tsx
import { useState, useEffect, useRef, useCallback } from 'react'
import request from '@/api/request'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { WhitelistItem } from '@/types'
import { toast } from 'sonner'
import { Copy, RefreshCw, Trash2 } from 'lucide-react' // 新增 Trash2
import { useNavigate } from 'react-router-dom'

export default function WhitelistTab() {
    const [list, setList] = useState<WhitelistItem[]>([])
    const [groupId, setGroupId] = useState('')
    const [copyingId, setCopyingId] = useState('')

    const [loading, setLoading] = useState(false)

    const navigate = useNavigate()
    const editGroupConfig = (groupId: string) => {
        navigate(`/dashboard/serverconfig?group=${groupId}`)
    }

    const abortControllerRef = useRef<AbortController | null>(null)

    const cancelPendingRequest = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
            abortControllerRef.current = null
        }
    }

    const loadWhitelist = useCallback(async () => {
        cancelPendingRequest()
        const controller = new AbortController()
        abortControllerRef.current = controller

        setLoading(true)
        try {
            const res = await request.get('/api/admin/groups', {
                signal: controller.signal,
            })
            if (mountedRef.current) {
                setList(res.data || [])
            }
        } catch (err: any) {
            if (err.name === 'AbortError' || !mountedRef.current) return
            toast.error(err.response?.data?.error || '加载失败')
            if (mountedRef.current) setList([])
        } finally {
            if (mountedRef.current) setLoading(false)
        }
    }, [])

    const mountedRef = useRef(true)
    useEffect(() => {
        mountedRef.current = true
        loadWhitelist()
        return () => {
            mountedRef.current = false
            cancelPendingRequest()
        }
    }, [loadWhitelist])

    const addWhitelist = async () => {
        const id = groupId.trim()
        if (!id) {
            toast.error('请输入群组ID')
            return
        }
        if (list.some((item) => item.group_id === id)) {
            toast.warning('已存在')
            return
        }
        try {
            await request.post('/api/admin/groups', { group_id: id })
            setGroupId('')
            toast.success('添加成功')
            await loadWhitelist()
        } catch (err: any) {
            toast.error(err.response?.data?.error || '添加失败')
        }
    }

    const toggleEnable = async (groupId: string, currentlyEnabled: boolean) => {
        try {
            await request.patch(`/api/admin/groups/${groupId}/enabled`, {
                enabled: !currentlyEnabled,
            })
            toast.success(currentlyEnabled ? '已禁用' : '已启用')
            await loadWhitelist()
        } catch (err) {
            toast.error('操作失败')
        }
    }

    const refreshToken = async (groupId: string) => {
        try {
            await request.patch(`/api/admin/groups/${groupId}/token`)
            toast.success('Token 已刷新')
            await loadWhitelist()
        } catch (err) {
            toast.error('刷新失败')
        }
    }

    const copyToken = async (token: string, groupId: string) => {
        try {
            setCopyingId(groupId)
            await navigator.clipboard.writeText(token)
            toast.success('已复制')
        } catch {
            toast.error('复制失败')
        } finally {
            setTimeout(() => setCopyingId(''), 1000)
        }
    }

    // 新增删除函数
    const deleteGroup = async (groupId: string) => {
        if (
            !confirm(
                `确定要删除群组 "${groupId}" 吗？此操作不可恢复，并会删除该群组的配置文件。`,
            )
        ) {
            return
        }
        try {
            await request.delete(`/api/admin/groups/${groupId}`)
            toast.success('删除成功')
            await loadWhitelist()
        } catch (err: any) {
            toast.error(err.response?.data?.error || '删除失败')
        }
    }

    return (
        <Card className="p-6 w-full h-full min-h-[700px] animate-fade-slide">
            <h2 className="text-lg font-semibold mb-4">群组白名单</h2>
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
                <Input
                    value={groupId}
                    onChange={(e) => setGroupId(e.target.value)}
                    placeholder="输入群组ID"
                    onKeyDown={(e) => e.key === 'Enter' && addWhitelist()}
                    className="flex-1"
                />
                <Button onClick={addWhitelist} className="sm:w-auto w-full">
                    添加群组
                </Button>
            </div>

            {loading ? (
                <div className="p-10 text-center">加载中...</div>
            ) : list.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                    暂无白名单群组
                </div>
            ) : (
                <div className="space-y-2">
                    {list.map((item) => (
                        <div
                            key={item.group_id}
                            className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-lg gap-3"
                        >
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">
                                        {item.group_id}
                                    </span>
                                    <span
                                        className={`text-xs px-2 py-0.5 rounded ${
                                            item.enabled
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                        }`}
                                    >
                                        {item.enabled ? '已启用' : '已禁用'}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-500">
                                    添加时间: {item.added_at}
                                </p>

                                <div className="flex items-center gap-2 mt-1">
                                    <div className="flex-1 bg-slate-100 p-2 rounded text-sm font-mono overflow-hidden text-ellipsis">
                                        {item.token}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() =>
                                            copyToken(item.token, item.group_id)
                                        }
                                        disabled={copyingId === item.group_id}
                                    >
                                        <Copy size={16} />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() =>
                                            refreshToken(item.group_id)
                                        }
                                        disabled={!item.enabled}
                                    >
                                        <RefreshCw size={16} />
                                    </Button>
                                </div>

                                <div className="flex gap-2 mt-1">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() =>
                                            editGroupConfig(item.group_id)
                                        }
                                    >
                                        编辑群组配置
                                    </Button>
                                    {/* 新增删除按钮 */}
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() =>
                                            deleteGroup(item.group_id)
                                        }
                                    >
                                        <Trash2 size={16} className="mr-1" />
                                        删除
                                    </Button>
                                </div>
                            </div>

                            <Button
                                variant={
                                    item.enabled ? 'destructive' : 'default'
                                }
                                size="sm"
                                onClick={() =>
                                    toggleEnable(item.group_id, item.enabled)
                                }
                            >
                                {item.enabled ? '禁用' : '启用'}
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    )
}
