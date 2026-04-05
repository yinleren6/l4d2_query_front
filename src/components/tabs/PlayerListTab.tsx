// src/components/tabs/ServerInfoTab.tsx
import { useState, useEffect, useCallback, useRef } from 'react'
import { Card } from '@/components/ui/card'
import request from '@/api/request'
import { toast } from 'sonner'
import { RefreshCw } from 'lucide-react'
import { ServerInfo } from '@/components/ServerCard'
import ServerList from '@/components/ServerList'
import { useAuthStore } from '@/store/authStore'

export default function PlayerListTab() {
    const { user } = useAuthStore()
    const [groups, setGroups] = useState<{ group_id: string; name: string }[]>(
        [],
    )
    const [selectedGroup, setSelectedGroup] = useState<string>('')
    const [serversMap, setServersMap] = useState<Record<string, ServerInfo>>({})
    const [serverOrder, setServerOrder] = useState<string[]>([]) // 排序后的 key 列表
    // 通过 ref 保持 serversMap 的最新值，用于在 done 事件中排序
    const serversMapRef = useRef(serversMap)
    useEffect(() => {
        serversMapRef.current = serversMap
    }, [serversMap])
    const servers = serverOrder.map((key) => serversMap[key]).filter(Boolean)

    const [loadingServers, setLoadingServers] = useState(false)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [error, setError] = useState('')
    const mountedRef = useRef(true)
    const eventSourceRef = useRef<EventSource | null>(null)
    const groupsInitializedRef = useRef(false)

    const isAdmin = user?.role === 'admin'
    const currentUserId = user?.id || ''
    const token = user?.token || ''
    const [loadingGroups, setLoadingGroups] = useState(false)

    const closeEventSource = useCallback(() => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close()
            eventSourceRef.current = null
        }
    }, [])

    const fetchServersStream = useCallback(
        async (groupId: string, isAutoRefresh: boolean) => {
            if (!groupId || !token) return

            if (isAutoRefresh) {
                setServersMap({})
                setServerOrder([]) // 清空顺序
                setLoadingServers(true)
            } else {
                setIsRefreshing(true)
            }
            setError('')
            closeEventSource()

            const url = `/api/stream/${groupId}?token=${encodeURIComponent(token)}`
            const es = new EventSource(url)
            eventSourceRef.current = es

            es.addEventListener('server', (event) => {
                try {
                    const serverData = JSON.parse(event.data) as ServerInfo
                    if (!mountedRef.current) return
                    setServersMap((prev) => ({
                        ...prev,
                        [serverData.ServerAddress]: serverData,
                    }))
                    // 不在每次 server 时排序，等到 done 时统一排序
                } catch (e) {
                    console.error('解析服务器数据失败', e)
                }
            })

            es.addEventListener('done', () => {
                if (!mountedRef.current) return
                // 根据服务器名称排序
                const currentMap = serversMapRef.current
                const sortedKeys = Object.keys(currentMap).sort((a, b) => {
                    const serverA = currentMap[a]
                    const serverB = currentMap[b]
                    if (!serverA || !serverB) return 0
                    return serverA.ServerName.localeCompare(
                        serverB.ServerName,
                        'zh',
                    )
                })
                setServerOrder(sortedKeys)

                if (isAutoRefresh) {
                    setLoadingServers(false)
                } else {
                    setIsRefreshing(false)
                    toast.success('服务器信息已更新')
                }
                closeEventSource()
            })

            es.addEventListener('error', (event) => {
                if (!mountedRef.current) return
                console.error('SSE 错误', event)
                setError('连接失败，请重试')
                toast.error('获取服务器信息失败')
                if (isAutoRefresh) {
                    setLoadingServers(false)
                } else {
                    setIsRefreshing(false)
                }
                closeEventSource()
            })
        },
        [token, closeEventSource],
    )

    const fetchGroups = useCallback(async () => {
        if (!isAdmin) return
        setLoadingGroups(true)
        try {
            const res = await request.get('/api/admin/groups')
            if (!mountedRef.current) return
            const enabledGroups = res.data
                .filter((g: any) => g.enabled === true)
                .map((g: any) => ({ group_id: g.group_id, name: g.group_id }))
            setGroups(enabledGroups)
        } catch (err) {
            if (mountedRef.current) {
                setError('无法加载群组列表')
                toast.error('获取群组列表失败')
            }
        } finally {
            if (mountedRef.current) setLoadingGroups(false)
        }
    }, [isAdmin])

    useEffect(() => {
        if (isAdmin && groups.length > 0 && !groupsInitializedRef.current) {
            groupsInitializedRef.current = true
            setSelectedGroup(groups[0].group_id)
        }
    }, [isAdmin, groups])

    useEffect(() => {
        if (isAdmin && selectedGroup) {
            fetchServersStream(selectedGroup, true)
        }
    }, [isAdmin, selectedGroup, fetchServersStream, closeEventSource])

    useEffect(() => {
        if (!isAdmin && currentUserId) {
            setSelectedGroup(currentUserId)
            fetchServersStream(currentUserId, true)
        } else if (!isAdmin && !currentUserId) {
            setError('无法获取用户信息')
        }
    }, [isAdmin, currentUserId, fetchServersStream])

    const handleRefresh = () => {
        if (selectedGroup && !isRefreshing && !loadingServers) {
            fetchServersStream(selectedGroup, false)
        }
    }

    useEffect(() => {
        if (isAdmin) {
            fetchGroups()
        }
    }, [isAdmin, fetchGroups])

    if (loadingGroups && isAdmin) {
        return <div className="p-8 text-center">加载中...</div>
    }
    if (groups.length === 0 && isAdmin && !loadingGroups) {
        return (
            <Card className="p-8 text-center text-muted-foreground">
                暂无可用群组，请先添加白名单群组。
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            {isAdmin && (
                <div className="flex items-center gap-4 flex-wrap">
                    <span className="text-sm font-medium">选择群组：</span>
                    <select
                        value={selectedGroup}
                        onChange={(e) => setSelectedGroup(e.target.value)}
                        className="px-3 py-1.5 border rounded-md bg-background text-sm"
                    >
                        {groups.map((group) => (
                            <option key={group.group_id} value={group.group_id}>
                                {group.name}
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing || loadingServers}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                        title="强制刷新（实时获取）"
                    >
                        <RefreshCw
                            size={18}
                            className={isRefreshing ? 'animate-spin' : ''}
                        />
                    </button>
                </div>
            )}
            {!isAdmin && (
                <div className="flex justify-end">
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing || loadingServers}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                        title="强制刷新"
                    >
                        <RefreshCw
                            size={18}
                            className={isRefreshing ? 'animate-spin' : ''}
                        />
                    </button>
                </div>
            )}
            <ServerList
                servers={servers}
                loading={loadingServers}
                error={error}
                emptyMessage="暂无服务器信息"
                placeholderCount={4}
                containerClassName="flex flex-col gap-4 w-full"
                cardClassName="w-full"
            />
        </div>
    )
}
