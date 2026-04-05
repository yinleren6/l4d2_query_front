// src/components/ServerCard.tsx

// import { toast } from 'sonner'

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

export default function ServerCard({ server, onJoin }: ServerCardProps) {
    const playersCount = `${server.Players}/${server.MaxPlayers}`
    const isFull = server.Players >= server.MaxPlayers
    const hasError = server.hasError || !server.ServerName

    // 加入服务器链接（steam 协议）
    const joinUrl = `steam://connect/${server.ServerAddress}?appid=550`

    const handleJoin = () => {
        if (onJoin) {
            console.log('onJoin:', onJoin)
            onJoin(server.ServerAddress)
        } else {
            console.log('Joining server:', joinUrl)
            window.open(joinUrl, '_blank')
        }
    }

    return (
        <div className="relative w-[360px] min-h-[300px] p-5 rounded-xl flex flex-col transition-all duration-300 hover:shadow-xl bg-white/60 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:-translate-y-1">
            {/* 状态指示灯 */}
            <div className="absolute top-9 right-6">
                <div
                    className={`w-8 h-5 rounded-full relative ${
                        hasError
                            ? 'bg-red-400'
                            : isFull
                              ? 'bg-orange-400'
                              : 'bg-green-500'
                    }`}
                >
                    <div
                        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${
                            hasError ? 'left-0.5' : 'left-[14.5px]'
                        }`}
                    />
                </div>
            </div>
            {/* 服务器名称区域 - 浅灰色背景 */}
            <div className="pr-10 font-bold text-lg break-words text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg mb-2">
                {server.ServerName || server.ServerAddress}
            </div>
            {/* 服务器详情行 - 无背景，与名称区形成对比 */}
            {!hasError && (
                <div className="flex text-sm mt-1 font-medium px-3">
                    <span className="flex-1 text-emerald-600 dark:text-emerald-400">
                        {server.Map}
                    </span>
                    <span className="mx-1 text-amber-500 dark:text-amber-400">
                        [{server.Mode}]
                    </span>
                    <span className="ml-auto text-slate-700 dark:text-slate-300">
                        {playersCount}
                    </span>
                </div>
            )}
            {/* 玩家列表区域 - 极浅蓝色背景，增加区分度 */}
            <div className="mt-3 flex-1 bg-blue-50/60 backdrop-blur-md dark:bg-slate-800/30 p-3 rounded-lg">
                {hasError ? (
                    <div className="text-red-500 text-center py-6 text-sm font-medium">
                        查询失败！
                    </div>
                ) : server.PlayersList && server.PlayersList.length > 0 ? (
                    <div className="space-y-1.0">
                        {server.PlayersList.map((player, idx) => (
                            <div
                                key={idx}
                                className="flex items-center gap-2 text-sm h-7 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                            >
                                <span className="w-8 flex-shrink-0 text-slate-600 dark:text-slate-400">
                                    [{player.score}]
                                </span>
                                <span className="w-20 flex-shrink-0 text-left text-slate-500 dark:text-slate-500">
                                    {player.time}
                                </span>
                                <div className="flex-1 overflow-hidden text-slate-700 dark:text-slate-300">
                                    <div className="whitespace-nowrap overflow-x-auto scrollbar-hide">
                                        {player.name}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-slate-400 text-center py-6 text-sm">
                        没有玩家在线
                    </div>
                )}
            </div>

            {/* 极致简约 - 浅灰蓝平色按钮 */}
            <div className="mt-auto pt-3 flex justify-end">
                <button
                    onClick={handleJoin}
                    className="px-6 py-2 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 transition-all duration-200 shadow-sm"
                >
                    进入服务器
                </button>
            </div>
        </div>
    )
}
