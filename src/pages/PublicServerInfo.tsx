import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import request from '@/api/request'
import ServerList from '@/components/ServerList'
import type { ServerInfo } from '@/components/ServerCard'

export default function PublicServerInfo() {
    const { groupID } = useParams<{ groupID: string }>()
    const [servers, setServers] = useState<ServerInfo[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const mountedRef = useRef(true)

    // 背景图轮播
    const [currentBgIndex, setCurrentBgIndex] = useState(0)
    const bgImages = [
        'https://www.dmoe.cc/random.php',
        'https://uapis.cn/api/v1/random/image?category=acg&type=pc',
        'https://www.loliapi.com/acg',
        'https://www.dmoe.cc/random.php',
        'https://uapis.cn/api/v1/random/image?category=acg&type=pc',
        'https://www.loliapi.com/acg',
        'https://www.dmoe.cc/random.php',
        'https://uapis.cn/api/v1/random/image?category=acg&type=pc',
        'https://www.loliapi.com/acg',
        'https://www.dmoe.cc/random.php',
        'https://uapis.cn/api/v1/random/image?category=acg&type=pc',
        'https://www.loliapi.com/acg',
        'https://www.dmoe.cc/random.php',
        'https://uapis.cn/api/v1/random/image?category=acg&type=pc',
        'https://www.loliapi.com/acg',
    ]
    const switchTime = 15000
    const transitionTime = 5000

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentBgIndex((prev) => (prev + 1) % bgImages.length)
        }, switchTime)
        return () => clearInterval(timer)
    }, [bgImages.length, switchTime])

    // 统计数据
    const onlineServerCount = servers.filter((s) => !s.hasError).length
    const totalServerCount = servers.length
    const onlinePlayerCount = servers.reduce(
        (t, s) => (!s.hasError ? t + s.Players : t),
        0,
    )
    const totalMaxPlayerCount = servers.reduce(
        (t, s) => (!s.hasError ? t + s.MaxPlayers : t),
        0,
    )

    useEffect(() => {
        if (!groupID) {
            setError('缺少群组ID')
            setLoading(false)
            return
        }
        const fetchData = async () => {
            try {
                const res = await request.get(`/api/public/query/${groupID}`)
                if (!mountedRef.current) return
                const data = res.data
                const serverList = Array.isArray(data)
                    ? data
                    : data.servers || []
                setServers(serverList)
            } catch (err: any) {
                if (!mountedRef.current) return
                setError(err.response?.data?.error || '获取服务器信息失败')
            } finally {
                if (mountedRef.current) setLoading(false)
            }
        }
        fetchData()
        return () => {
            mountedRef.current = false
        }
    }, [groupID])

    return (
        <div
            className="min-h-screen relative overflow-hidden"
            style={{
                fontFamily: "'MaokenZhuyuanTi', 'Microsoft YaHei', sans-serif",
            }}
        >
            {/* 背景轮播 */}
            {bgImages.map((img, idx) => (
                <div
                    key={idx}
                    className="absolute inset-0 bg-cover bg-center bg-fixed transition-opacity ease-in-out"
                    style={{
                        opacity: idx === currentBgIndex ? 1 : 0,
                        backgroundImage: `url("${img}")`,
                        backgroundColor: '#f9f9f9',
                        zIndex: -10,
                        transitionDuration: `${transitionTime}ms`,
                    }}
                />
            ))}

            {/* 遮罩 */}
            <div className="absolute inset-0 bg-slate-900/30 z-[-5]" />

            {/* 内容 */}
            <div className="relative z-10 animate-popBounce">
                <div className="grid grid-cols-[repeat(auto-fill,360px)] justify-center gap-6 p-4 md:p-6 max-w-7xl mx-auto">
                    <div className="col-span-full bg-orange-50/60 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 rounded-xl p-5 shadow-md">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                            <span className="text-amber-500">🔔</span>{' '}
                            服务器公告
                        </h3>

                        {/* 每个 FAQ 项目都加了统一间距 */}
                        <div className="space-y-4">
                            <div>
                                <h3 className="notice text-xl text-amber-500 font-bold">
                                    ⭐萌新首次游玩如何进服⭐
                                </h3>
                                <p className="mt-1 text-slate-700 dark:text-slate-300">
                                    加入悠悠Q群1067085569，点击右侧按钮即可全自动进入！但还是建议新人先看悠悠进服向导»
                                </p>
                            </div>

                            <div>
                                <h3 className="notice text-xl text-amber-500 font-bold">
                                    ⭐为什么进服后皮肤没了⭐
                                </h3>
                                <p className="mt-1 text-slate-700 dark:text-slate-300">
                                    进服速度太快导致模组来不及加载！建议先启动游戏等模组全部加载完毕，再切屏回来点击进服按钮
                                </p>
                            </div>

                            <div>
                                <h3 className="notice text-xl text-amber-500 font-bold">
                                    ⭐进服显示尚未安装战役⭐
                                </h3>
                                <p className="mt-1 text-slate-700 dark:text-slate-300">
                                    请检查指定三方图是否安装完毕！若是工坊订阅的请看进度条是否走完，先进游戏再切屏回来点按钮
                                </p>
                            </div>

                            <div>
                                <h3 className="notice text-xl text-amber-500 font-bold">
                                    ⭐点击进服按钮没有反应⭐
                                </h3>
                                <p className="mt-1 text-slate-700 dark:text-slate-300">
                                    你是直接在微信或QQ内打开的进站吗？请将链接复制到浏览器访问，或点击右上角地球图标跳转浏览器内
                                </p>
                            </div>

                            <div>
                                <h3 className="notice text-xl text-amber-500 font-bold">
                                    ⭐进服显示会话已不可用⭐
                                </h3>
                                <p className="mt-1 text-slate-700 dark:text-slate-300">
                                    大概率是同时进入的人太多服务器处理不过来，请稍等几秒后重新进吧，或者进入其他子服试试
                                </p>
                            </div>

                            <div>
                                <h3 className="notice text-xl text-amber-500 font-bold">
                                    ⭐服务器指定的app id无效⭐
                                </h3>
                                <p className="mt-1 text-slate-700 dark:text-slate-300">
                                    Steam偶尔抽风导致的！建议将窗口里的IP地址复制下来，然后再手动connect
                                    IP即可进服
                                </p>
                            </div>
                        </div>
                    </div>

                    {!loading && !error && (
                        <div className="col-span-full bg-white/60 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 rounded-xl p-4 shadow-md flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-slate-700 dark:text-slate-300 font-medium">
                                    在线玩家：
                                </span>
                                <span className="text-orange-500 dark:text-orange-400 font-bold">
                                    {onlinePlayerCount}/{totalMaxPlayerCount}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-slate-700 dark:text-slate-300 font-medium">
                                    在线服务器：
                                </span>
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                    {onlineServerCount}/{totalServerCount}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-[repeat(auto-fill,360px)] justify-center gap-6 p-4 md:p-6 max-w-7xl mx-auto">
                    <ServerList
                        servers={servers}
                        loading={loading}
                        error={error}
                        emptyMessage="暂无服务器信息"
                        containerClassName="contents"
                    />
                </div>
            </div>
        </div>
    )
}
