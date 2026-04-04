//// src/pages/GroupConfigPage.tsx - 基于Token登录编辑群配置
import { useState, useEffect, useRef, useCallback } from 'react'
import request from '@/api/request'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { useSearchParams } from 'react-router-dom'

interface GroupConfig {
    group_id: string
    auto_reply: boolean
    max_msg_num: number
}

export default function GroupConfigPage() {
    const [searchParams] = useSearchParams()
    const groupId = searchParams.get('groupId') || ''
    const [config, setConfig] = useState<GroupConfig | null>(null)
    const [token, setToken] = useState('')
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)

    const abortControllerRef = useRef<AbortController | null>(null)
    const mountedRef = useRef(true)

    useEffect(() => {
        mountedRef.current = true
        return () => {
            mountedRef.current = false
            abortControllerRef.current?.abort()
        }
    }, [])

    const cancelPendingRequest = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
            abortControllerRef.current = null
        }
    }

    const loadConfig = useCallback(async () => {
        if (!groupId) {
            toast.error('缺少群组ID参数')
            return
        }
        if (!token.trim()) {
            toast.error('请输入Token')
            return
        }

        cancelPendingRequest()
        const controller = new AbortController()
        abortControllerRef.current = controller

        setLoading(true)
        try {
            const res = await request.get(`/api/group/config/${groupId}`, {
                headers: { Authorization: `Bearer ${token.trim()}` },
                signal: controller.signal,
            })
            if (mountedRef.current) {
                setConfig(res.data)
                toast.success('配置加载成功')
            }
        } catch (err: any) {
            if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
                return
            }
            if (mountedRef.current) {
                toast.error(
                    err.response?.data?.error ||
                        'Token无效或无权限访问该群组配置',
                )
            }
        } finally {
            if (mountedRef.current) setLoading(false)
        }
    }, [groupId, token])

    const saveConfig = useCallback(async () => {
        if (!config) {
            toast.error('请先加载配置')
            return
        }
        if (!token.trim()) {
            toast.error('Token不能为空')
            return
        }

        cancelPendingRequest()
        const controller = new AbortController()
        abortControllerRef.current = controller

        setSaving(true)
        try {
            await request.put(`/api/group/config/${groupId}`, config, {
                headers: { Authorization: `Bearer ${token.trim()}` },
                signal: controller.signal,
            })
            if (mountedRef.current) {
                toast.success('配置保存成功')
            }
        } catch (err: any) {
            if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
                return
            }
            if (mountedRef.current) {
                toast.error(err.response?.data?.error || '保存配置失败')
            }
        } finally {
            if (mountedRef.current) setSaving(false)
        }
    }, [config, token, groupId])

    return (
        <Card className="p-6 max-w-2xl mx-auto mt-8">
            <h2 className="text-lg font-semibold mb-4">群组配置编辑</h2>

            {/* 显示群组ID（只读） */}
            {groupId && (
                <div className="mb-4 text-sm text-muted-foreground">
                    当前群组ID：<span className="font-mono">{groupId}</span>
                </div>
            )}

            {/* Token登录区域 */}
            <div className="flex gap-2 mb-6">
                <Input
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="输入该群组的Token"
                    onKeyDown={(e) => e.key === 'Enter' && loadConfig()}
                    className="flex-1"
                    disabled={loading || saving}
                />
                <Button onClick={loadConfig} disabled={loading || saving}>
                    {loading ? '加载中...' : '验证并加载配置'}
                </Button>
            </div>

            {/* 配置编辑区域 */}
            {config ? (
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium mb-1 block">
                            群组ID
                        </label>
                        <Input value={config.group_id} disabled readOnly />
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
                            disabled={saving}
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
                            disabled={saving}
                        />
                    </div>

                    <Button
                        onClick={saveConfig}
                        disabled={loading || saving}
                        className="w-full sm:w-auto"
                    >
                        {saving ? '保存中...' : '保存配置'}
                    </Button>
                </div>
            ) : (
                <div className="p-4 text-center text-muted-foreground">
                    请输入有效Token加载配置
                </div>
            )}
        </Card>
    )
}
