// src/components/tabs/ServerInfoTab.tsx
import { useState, useEffect, useCallback, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import request from '@/api/request'
import { toast } from 'sonner'
import { RefreshCw } from 'lucide-react'
import ServerCard, { ServerInfo } from '@/components/ServerCard' // 引入卡片组件

// 群组选项
interface GroupOption {
    group_id: string
    name: string
}

export default function ServerInfoTab() {
    const [groups, setGroups] = useState<GroupOption[]>([])
    const [selectedGroup, setSelectedGroup] = useState<string>('')
    const [servers, setServers] = useState<ServerInfo[]>([])
    const [loadingGroups, setLoadingGroups] = useState(true)
    const [loadingServers, setLoadingServers] = useState(false)
    const [error, setError] = useState('')
    const mountedRef = useRef(true)

    const fetchGroups = useCallback(async () => {
        try {
            const res = await request.get('/api/admin/groups')
            if (!mountedRef.current) return
            const groupList = res.data.map((g: any) => ({
                group_id: g.group_id,
                name: g.group_id,
            }))
            setGroups(groupList)
            if (groupList.length > 0 && !selectedGroup) {
                setSelectedGroup(groupList[0].group_id)
            }
        } catch (err) {
            if (mountedRef.current) {
                toast.error('获取群组列表失败')
                setError('无法加载群组列表')
            }
        } finally {
            if (mountedRef.current) setLoadingGroups(false)
        }
    }, [selectedGroup])

    const fetchServers = useCallback(async (groupId: string) => {
        if (!groupId) return
        setLoadingServers(true)
        setServers([])
        setError('')
        try {
            // const res = await request.get(`/api/fetch-server-info/${groupId}`)
            const res = [
                {
                    ServerName: '【十九】的战役多特3服',
                    ServerAddress: '127.0.0.1:27015',
                    Map: 'c2m1_highway',
                    Mode: '战役',
                    Players: 0,
                    MaxPlayers: 20,
                    PlayersList: [],
                    hasError: false,
                    failCount: 0,
                },
                {
                    ServerName: '橘子/战役/多特服',
                    ServerAddress: '127.0.0.1:27016',
                    Map: 'c2m1_highway',
                    Mode: '战役',
                    Players: 0,
                    MaxPlayers: 15,
                    PlayersList: [],
                    hasError: false,
                    failCount: 0,
                },
                {
                    ServerName: 'uu的战役多特1服',
                    ServerAddress: '127.0.0.1:27017',
                    Map: 'rh_map04',
                    Mode: '战役',
                    Players: 7,
                    MaxPlayers: 20,
                    PlayersList: [
                        { score: 13, time: '0h39m32s', name: 'Paradise' },
                        { score: 0, time: '0h35m36s', name: '丢娜美级别' },
                        { score: 2, time: '0h31m02s', name: 'fallenleaf' },
                        { score: 3, time: '0h21m57s', name: '琳' },
                        { score: 5, time: '0h09m07s', name: 'Loken' },
                        { score: 1, time: '0h06m25s', name: '小鸡' },
                        {
                            score: 0,
                            time: '0h03m00s',
                            name: '百炼成钢 回首你不再',
                        },
                    ],
                    hasError: false,
                    failCount: 0,
                },
                {
                    ServerName: 'uu的战役服',
                    ServerAddress: '127.0.0.1:27018',
                    Map: 'c2m1_highway',
                    Mode: '战役',
                    Players: 0,
                    MaxPlayers: 16,
                    PlayersList: [],
                    hasError: false,
                    failCount: 0,
                },
                {
                    ServerName: '荣誉的服务器',
                    ServerAddress: '127.0.0.1:27019',
                    Map: 'c2m1_highway',
                    Mode: '战役',
                    Players: 0,
                    MaxPlayers: 18,
                    PlayersList: [],
                    hasError: false,
                    failCount: 0,
                },
                {
                    ServerName: '【UU】的药抗服',
                    ServerAddress: '127.0.0.1:27020',
                    Map: 'c2m1_highway',
                    Mode: '对抗',
                    Players: 0,
                    MaxPlayers: 30,
                    PlayersList: [],
                    hasError: false,
                    failCount: 0,
                },
            ]
            if (!mountedRef.current) return
            // const data = res.data
            // const serverList = Array.isArray(data) ? data : data.servers || []
            setServers(res)
        } catch (err: any) {
            if (!mountedRef.current) return
            const msg = err.response?.data?.error || '获取服务器信息失败'
            setError(msg)
            toast.error(msg)
        } finally {
            if (mountedRef.current) setLoadingServers(false)
        }
    }, [])

    useEffect(() => {
        mountedRef.current = true
        fetchGroups()
        return () => {
            mountedRef.current = false
        }
    }, [fetchGroups])

    useEffect(() => {
        if (selectedGroup) {
            fetchServers(selectedGroup)
        }
    }, [selectedGroup, fetchServers])

    const handleRefresh = () => {
        if (selectedGroup) fetchServers(selectedGroup)
    }

    if (loadingGroups) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-10 w-48" />
                <div className="flex flex-wrap gap-4">
                    {[1, 2, 3].map((i) => (
                        <Skeleton
                            key={i}
                            className="w-[328px] h-[280px] rounded-2xl"
                        />
                    ))}
                </div>
            </div>
        )
    }

    if (groups.length === 0) {
        return (
            <Card className="p-8 text-center text-muted-foreground">
                暂无可用群组，请先添加白名单群组。
            </Card>
        )
    }

    return (
        <div className="space-y-6">
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
                >
                    <RefreshCw
                        size={18}
                        className={loadingServers ? 'animate-spin' : ''}
                    />
                </button>
            </div>

            {loadingServers ? (
                <div className="flex flex-wrap gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton
                            key={i}
                            className="w-[328px] h-[280px] rounded-2xl"
                        />
                    ))}
                </div>
            ) : error ? (
                <Card className="p-8 text-center text-destructive">
                    {error}
                </Card>
            ) : servers.length === 0 ? (
                <Card className="p-8 text-center text-muted-foreground">
                    暂无服务器信息
                </Card>
            ) : (
                <div className="flex flex-wrap gap-4">
                    {servers.map((server, idx) => (
                        <ServerCard key={idx} server={server} />
                    ))}
                </div>
            )}
        </div>
    )
}
