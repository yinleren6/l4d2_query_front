// src/components/tabs/WhitelistTab.tsx
import { useState, useEffect, useRef, useCallback } from 'react'
import request from '@/api/request'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { WhitelistItem } from '@/types'
import { toast } from 'sonner'
import { Copy, RefreshCw, X } from 'lucide-react'

interface GroupConfig {
    group_id: string
    auto_reply: boolean
    max_msg_num: number
}

export default function WhitelistTab() {
    const [list, setList] = useState<WhitelistItem[]>([])
    const [groupId, setGroupId] = useState('')
    const [copyingId, setCopyingId] = useState('')
    const [showConfigEditor, setShowConfigEditor] = useState(false)
    const [currentEditGroupId, setCurrentEditGroupId] = useState('')
    const [token, setToken] = useState('')
    const [config, setConfig] = useState<GroupConfig | null>(null)
    const [loading, setLoading] = useState(false)

    // 用于取消进行中的请求
    const abortControllerRef = useRef<AbortController | null>(null)

    // 通用：取消当前请求
    const cancelPendingRequest = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
            abortControllerRef.current = null
        }
    }

    // 加载白名单（可取消）
    const loadWhitelist = useCallback(async () => {
        if (mountedRef.current) {
            setLoading(false)
        }
        cancelPendingRequest()
        const controller = new AbortController()
        abortControllerRef.current = controller

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
            await loadWhitelist() // 重新加载，等待完成
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

    const openConfigEditor = (groupId: string) => {
        setCurrentEditGroupId(groupId)
        setShowConfigEditor(true)
        setToken('')
        setConfig(null)
    }

    const closeConfigEditor = () => {
        setShowConfigEditor(false)
        setCurrentEditGroupId('')
        setToken('')
        setConfig(null)
    }

    const loadConfig = async () => {
        if (!currentEditGroupId || !token) {
            toast.warning('请输入 Token')
            return
        }
        const controller = new AbortController()
        abortControllerRef.current = controller
        setLoading(true)
        try {
            const res = await request.get(
                `/api/group/config/${currentEditGroupId}`,
                {
                    signal: controller.signal,
                    headers: { Authorization: `Bearer ${token}` },
                },
            )
            if (mountedRef.current) setConfig(res.data)
            toast.success('加载成功')
        } catch {
            toast.error('Token 无效或无权限')
        } finally {
            if (mountedRef.current) setLoading(false)
        }
    }

    const saveConfig = async () => {
        if (!config || !currentEditGroupId || !token) return
        const controller = new AbortController()
        abortControllerRef.current = controller
        setLoading(true)
        try {
            await request.put(
                `/api/group/config/${currentEditGroupId}`,
                config,
                {
                    signal: controller.signal,
                    headers: { Authorization: `Bearer ${token}` },
                },
            )
            toast.success('保存成功')

            await loadConfig()
        } catch {
            toast.error('保存失败')
        } finally {
            if (mountedRef.current) setLoading(false)
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

            {showConfigEditor && (
                <div className="border rounded-lg p-4 mb-4 bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex justify-between items-center mb-3 animate-fade-slide">
                        <h3 className="font-medium">
                            编辑群组配置：{currentEditGroupId}
                        </h3>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={closeConfigEditor}
                        >
                            <X size={16} />
                        </Button>
                    </div>

                    <div className="flex gap-2 mb-4">
                        <Input
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            placeholder="输入该群组的Token"
                            onKeyDown={(e) => e.key === 'Enter' && loadConfig()}
                            className="flex-1"
                        />
                        <Button onClick={loadConfig} disabled={loading}>
                            验证并加载配置
                        </Button>
                    </div>

                    {config ? (
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-1 block">
                                    群组ID
                                </label>
                                <Input
                                    value={config.group_id}
                                    disabled
                                    readOnly
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">
                                    自动回复
                                </label>
                                <select
                                    className="w-full p-2 border rounded-lg"
                                    value={config.auto_reply ? '1' : '0'}
                                    onChange={(e) =>
                                        setConfig({
                                            ...config,
                                            auto_reply: e.target.value === '1',
                                        })
                                    }
                                >
                                    <option value="1">开启</option>
                                    <option value="0">关闭</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">
                                    最大消息数
                                </label>
                                <Input
                                    type="number"
                                    value={config.max_msg_num}
                                    onChange={(e) =>
                                        setConfig({
                                            ...config,
                                            max_msg_num: Number(e.target.value),
                                        })
                                    }
                                />
                            </div>
                            <Button onClick={saveConfig} disabled={loading}>
                                保存配置
                            </Button>
                        </div>
                    ) : (
                        <div className="p-2 text-center text-muted-foreground text-sm">
                            请输入有效Token加载配置
                        </div>
                    )}
                </div>
            )}

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

                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="mt-1"
                                    onClick={() =>
                                        openConfigEditor(item.group_id)
                                    }
                                >
                                    编辑群组配置
                                </Button>
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
