// src/components/ServerList.tsx 完整可替换代码
import ServerCard, { ServerInfo } from '@/components/ServerCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'

interface ServerListProps {
    servers: ServerInfo[]
    loading: boolean
    error?: string | null
    emptyMessage?: string
    /** 自定义占位卡片数量，默认 4 */
    placeholderCount?: number
    /** 自定义容器样式（flex 布局） */
    containerClassName?: string
    /** 自定义单个卡片包装样式 */
    cardClassName?: string
}

export default function ServerList({
    servers,
    loading,
    error,
    emptyMessage = '暂无服务器信息',
    placeholderCount = 4,
    // 核心：改回自动填充固定360px卡片的网格，保留优化的间距
    containerClassName = 'grid grid-cols-[repeat(auto-fill,minmax(360px,1fr))] justify-center gap-4 p-6 w-full max-w-[1600px] mx-auto',
    cardClassName = '',
}: ServerListProps) {
    if (loading) {
        return (
            <div className={containerClassName}>
                {Array.from({ length: placeholderCount }).map((_, i) => (
                    <Skeleton
                        key={i}
                        className={`w-[360px] h-[300px] rounded-xl ${cardClassName}`}
                    />
                ))}
            </div>
        )
    }

    if (error) {
        return (
            <Card className="p-10 text-center text-destructive mx-6 mt-6 border-destructive/20 bg-destructive/5 rounded-xl">
                <p className="font-medium">{error}</p>
            </Card>
        )
    }

    if (servers.length === 0) {
        return (
            <Card className="p-10 text-center text-muted-foreground mx-6 mt-6 rounded-xl border border-slate-200 dark:border-slate-800">
                <p className="font-medium">{emptyMessage}</p>
            </Card>
        )
    }

    return (
        <div className={containerClassName}>
            {servers.map((server) => (
                <ServerCard key={server.ServerAddress} server={server} />
            ))}
        </div>
    )
}
