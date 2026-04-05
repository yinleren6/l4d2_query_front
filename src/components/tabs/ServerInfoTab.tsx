// src/components/tabs/ServerInfoTab.tsx
import { useState, useEffect, useCallback, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import request from '@/api/request'
import { toast } from 'sonner'
import { RefreshCw } from 'lucide-react'
import { ServerInfo } from '@/components/ServerCard'
import ServerList from '@/components/ServerList'
import { useAuthStore } from '@/store/authStore'

export default function ServerInfoTab() {
    const { user } = useAuthStore()
    const [groups, setGroups] = useState<{ group_id: string; name: string }[]>(
        [],
    )
    const [selectedGroup, setSelectedGroup] = useState<string>('')
    // const [servers, setServers] = useState<ServerInfo[]>([])
    const [serversMap, setServersMap] = useState<Record<string, ServerInfo>>({})
    const servers = Object.values(serversMap)
    const [loadingGroups, setLoadingGroups] = useState(true)
    const [loadingServers, setLoadingServers] = useState(false)
    const [error, setError] = useState('')
    const mountedRef = useRef(true)
    const eventSourceRef = useRef<EventSource | null>(null)

    const isAdmin = user?.role === 'admin'
    const currentUserId = user?.id || ''
    const token = user?.token || ''

    // 关闭 SSE 连接
    const closeEventSource = useCallback(() => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close()
            eventSourceRef.current = null
        }
    }, [])

    // 管理员才需要获取群组列表
    const fetchGroups = useCallback(async () => {
        if (!isAdmin) return
        try {
            const res = await request.get('/api/admin/groups')
            if (!mountedRef.current) return
            // 只保留启用的群组，并映射为需要的格式
            const groupList: { group_id: string; name: string }[] = res.data
                .filter((g: any) => g.enabled === true)
                .map((g: any) => ({
                    group_id: g.group_id,
                    name: g.group_id,
                }))
            setGroups(groupList)
            // 如果当前选中的群组不在新列表中，则重置选择
            if (groupList.length > 0) {
                if (
                    !selectedGroup ||
                    !groupList.some((g) => g.group_id === selectedGroup)
                ) {
                    setSelectedGroup(groupList[0].group_id)
                }
            } else {
                setSelectedGroup('')
            }
        } catch (err) {
            if (mountedRef.current) {
                setError('无法加载群组列表')
                toast.error('获取群组列表失败')
            }
        } finally {
            if (mountedRef.current) setLoadingGroups(false)
        }
    }, [isAdmin, selectedGroup])

    // 流式接口（手动刷新时使用，逐个显示服务器）
    const fetchServersStream = useCallback(
        async (groupId: string, isAutoRefresh = false) => {
            if (!groupId || !token) return

            // 如果是自动加载且已有缓存数据，可以先用缓存快速展示（可选）
            // 这里为了简化，直接使用流式，因为后端有缓存，流式也会快速返回
            // setServers([]) // ✅ 关键：清空旧卡片，防止追加
            setLoadingServers(true)
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
                } catch (e) {
                    console.error('解析服务器数据失败', e)
                }
            })

            es.addEventListener('done', () => {
                if (mountedRef.current) {
                    setLoadingServers(false)
                    if (!isAutoRefresh) {
                        toast.success('服务器信息已更新')
                    }
                }
                closeEventSource()
            })

            es.addEventListener('error', (event) => {
                if (!mountedRef.current) return
                console.error('SSE 错误', event)
                setError('连接失败，请重试')
                toast.error('获取服务器信息失败')
                setLoadingServers(false)
                closeEventSource()
            })
        },
        [token, closeEventSource],
    )

    // 初始化：管理员加载群组，普通用户直接使用自己的 ID
    useEffect(() => {
        mountedRef.current = true
        if (isAdmin) {
            fetchGroups()
        } else {
            setLoadingGroups(false)
            if (currentUserId) {
                setSelectedGroup(currentUserId)
                // 普通用户首次加载也使用流式接口
                fetchServersStream(currentUserId, true)
            } else {
                setError('无法获取用户信息')
            }
        }
        return () => {
            mountedRef.current = false
            closeEventSource()
        }
    }, [
        isAdmin,
        currentUserId,
        fetchGroups,
        fetchServersStream,
        closeEventSource,
    ])
    // 当 groups 列表变化时，确保 selectedGroup 有效
    useEffect(() => {
        if (isAdmin && groups.length > 0) {
            if (
                !selectedGroup ||
                !groups.some((g) => g.group_id === selectedGroup)
            ) {
                setSelectedGroup(groups[0].group_id)
            }
        }
    }, [isAdmin, groups, selectedGroup])
    // 管理员切换群组时使用流式接口
    useEffect(() => {
        if (isAdmin && selectedGroup) {
            fetchServersStream(selectedGroup, true)
        }
    }, [isAdmin, selectedGroup, fetchServersStream])

    // 手动刷新：调用流式接口并显示 toast
    const handleRefresh = () => {
        if (selectedGroup) {
            fetchServersStream(selectedGroup, false)
        }
    }

    const PlaceholderCard = () => (
        <div className="relative w-[360px] min-h-[280px] p-3 pb-2 border-2 border-blue-400 rounded-2xl flex flex-col bg-white/50 dark:bg-slate-900/50 opacity-50">
            {/* 状态指示灯占位 */}
            <div className="absolute top-3 right-6">
                <div className="w-10 h-5 rounded-full bg-gray-300 dark:bg-gray-600" />
            </div>
            {/* 服务器名称占位 */}
            <div className="pr-10 h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            {/* 详情行占位 */}
            <div className="flex mt-2 gap-2">
                <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
            {/* 玩家列表占位（模拟几条线） */}
            <div className="mt-3 space-y-2">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
            {/* 按钮占位 */}
            <div className="mt-auto pt-2 flex gap-1">
                <div className="flex-1 h-8 bg-gray-300 dark:bg-gray-600 rounded-md" />
                <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-md" />
            </div>
        </div>
    )

    if (loadingGroups) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-10 w-48" />
                <div className="flex flex-wrap gap-4">
                    {[1, 2, 3].map((i) => (
                        <PlaceholderCard key={i} />
                    ))}
                </div>
            </div>
        )
    }

    if (groups.length === 0 && isAdmin) {
        return (
            <Card className="p-8 text-center text-muted-foreground">
                暂无可用群组，请先添加白名单群组。
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            {/* 管理员显示群组下拉和刷新按钮 */}
            {isAdmin && (
                <div className="flex items-center gap-4 flex-wrap">
                    <span className="text-sm font-medium">选择群组：</span>
                    <select
                        value={selectedGroup}
                        onChange={(e) => setSelectedGroup(e.target.value)}
                        className="px-3 py-1.5 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        {groups.map((group) => (
                            <option key={group.group_id} value={group.group_id}>
                                {group.name}
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={handleRefresh}
                        disabled={loadingServers}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                        title="强制刷新（实时获取）"
                    >
                        <RefreshCw
                            size={18}
                            className={loadingServers ? 'animate-spin' : ''}
                        />
                    </button>
                </div>
            )}

            {/* 非管理员也显示刷新按钮（仅刷新自己的群组） */}
            {!isAdmin && (
                <div className="flex justify-end">
                    <button
                        onClick={handleRefresh}
                        disabled={loadingServers}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                        title="强制刷新"
                    >
                        <RefreshCw
                            size={18}
                            className={loadingServers ? 'animate-spin' : ''}
                        />
                    </button>
                </div>
            )}
            <ServerList
                servers={servers} // 注意这里是转换后的数组
                loading={loadingServers}
                error={error}
                emptyMessage="暂无服务器信息"
                placeholderCount={4}
                containerClassName="flex flex-wrap justify-center gap-4 p-4 w-full mx-auto"
            />
        </div>
    )
}
