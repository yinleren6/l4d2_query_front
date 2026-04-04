// src/components/ServerCard.tsx
import { ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

// 玩家信息类型
export interface Player {
    score: number
    time: string
    name: string
}

// 服务器信息类型
export interface ServerInfo {
    ServerName: string
    ServerAddress: string
    Map: string
    Mode: string
    Players: number
    MaxPlayers: number
    PlayersList: Player[]
    hasError?: boolean
    failCount?: number
}

interface ServerCardProps {
    server: ServerInfo
    onJoin?: (address: string) => void // 可选，自定义加入逻辑（默认用 steam://）
    onCopy?: (address: string) => void // 可选，自定义复制逻辑
}

export default function ServerCard({
    server,
    onJoin,
    onCopy,
}: ServerCardProps) {
    const playersCount = `${server.Players}/${server.MaxPlayers}`
    const isFull = server.Players >= server.MaxPlayers
    const hasError = server.hasError || !server.ServerName

    // 加入服务器链接（steam 协议）
    const joinUrl = `steam://connect/${server.ServerAddress}`

    const handleJoin = () => {
        if (onJoin) {
            onJoin(server.ServerAddress)
        } else {
            window.open(joinUrl, '_blank')
        }
    }

    const handleCopy = async () => {
        const text = `connect ${server.ServerAddress}`
        if (onCopy) {
            onCopy(server.ServerAddress)
        } else {
            await navigator.clipboard.writeText(text)
            toast.success('地址已复制')
        }
    }

    return (
        <div className="relative w-[328px] min-h-[280px] p-3 pb-2 border-2 border-blue-400 rounded-2xl flex flex-col transition-all hover:shadow-md bg-white dark:bg-slate-900">
            {/* 状态指示灯 */}
            <div className="absolute top-3 right-6">
                <div
                    className={`w-10 h-5 rounded-full transition-colors ${
                        hasError
                            ? 'bg-red-400'
                            : isFull
                              ? 'bg-orange-400'
                              : 'bg-purple-500'
                    } relative`}
                >
                    <div
                        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${
                            hasError
                                ? 'left-0.5'
                                : isFull
                                  ? 'left-[18px]'
                                  : 'left-[18px]'
                        }`}
                    />
                </div>
            </div>

            {/* 服务器名称 */}
            <div className="pr-10 font-semibold text-base break-words">
                {server.ServerName || server.ServerAddress}
            </div>

            {/* 服务器详情行 */}
            {!hasError && (
                <div className="flex text-sm mt-1 text-gray-600 dark:text-gray-300">
                    <span className="flex-1 text-green-600">{server.Map}</span>
                    <span className="mx-1">[{server.Mode}]</span>
                    <span className="ml-auto">{playersCount}</span>
                </div>
            )}

            {/* 玩家列表 */}
            <div className="mt-2 max-h-32 overflow-y-auto">
                {hasError ? (
                    <div className="text-red-500 text-center py-2">
                        查询失败！
                    </div>
                ) : server.PlayersList && server.PlayersList.length > 0 ? (
                    server.PlayersList.map((player, idx) => (
                        <div
                            key={idx}
                            className="flex items-center gap-2 text-sm h-6"
                        >
                            <span className="w-8 flex-shrink-0">
                                [{player.score}]
                            </span>
                            <span className="w-12 flex-shrink-0 text-right">
                                {player.time}
                            </span>
                            <div className="flex-1 overflow-hidden">
                                <div className="whitespace-nowrap overflow-x-auto scrollbar-hide">
                                    {player.name}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-gray-400 text-center py-2">
                        没有玩家在线
                    </div>
                )}
            </div>

            {/* 加入服务器按钮 */}
            <div className="mt-auto pt-2 flex gap-1">
                <button
                    onClick={handleJoin}
                    className="flex-1 text-center bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-1.5 rounded-l-md hover:from-indigo-600 hover:to-purple-700 transition"
                >
                    进入服务器
                </button>
                <button
                    onClick={handleCopy}
                    className="px-3 bg-gradient-to-r from-purple-600 to-indigo-500 text-white rounded-r-md hover:from-purple-700 hover:to-indigo-600 transition"
                >
                    <ExternalLink size={16} />
                </button>
            </div>
        </div>
    )
}
