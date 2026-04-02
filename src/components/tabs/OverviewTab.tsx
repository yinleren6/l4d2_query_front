import { useEffect, useState } from 'react'
import request from '@/api/request'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { OverviewStats, DailyStat } from '@/types'
import { toast } from 'sonner'

import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import axios from 'axios'

export default function OverviewTab() {
  const [overview, setOverview] = useState<OverviewStats | null>(null)
  const [daily, setDaily] = useState<DailyStat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    const fetchStats = async () => {
      try {
        setLoading(true)
        setError('')
        // 修复：泛型直接写数据类型，Axios会自动包装成 { data: T }
        const [overviewRes, dailyRes] = await Promise.all([
          request.get<OverviewStats>('/api/stats/overview', { signal: controller.signal }),
          request.get<DailyStat[]>('/api/stats/daily?days=7', { signal: controller.signal })
        ])
        // 直接取 .data 即可
        setOverview(overviewRes.data)
        setDaily(dailyRes.data)
      } catch (err: unknown) {
        if ((err as Error).name === 'AbortError') return
        let errorMsg = '加载统计数据失败，请刷新重试'
        if (axios.isAxiosError(err) && err.response?.status === 401)  {
          errorMsg = '登录已过期，请重新登录'
        } else if (axios.isAxiosError(err) && err.response?.status === 404) {
          errorMsg = '统计接口不存在，请检查后端服务'
        }
        setError(errorMsg)
        toast.error(errorMsg)
        console.error('加载统计失败', err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
    // if (controller.signal.aborted) return;
    return () => controller.abort()
  }, [])

  // 加载状态 UI
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        {/* <Spinner className="w-8 h-8 animate-spin text-primary" /> */}
        <p className="text-muted-foreground">加载统计数据中...</p>
      </div>
    )
  }

  // 错误状态 UI（替换悬浮的红色提示）
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <p className="text-destructive text-lg font-medium">{error}</p>
        <Button onClick={() => window.location.reload()}>刷新重试</Button>
      </div>
    )
  }

  // 正常渲染：统计卡片 + 图表
  return (
    <div className="space-y-6">
      {/* 统计卡片：响应式网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">总用户数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.total_users ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">今日活跃</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.today_active ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">今日请求</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.today_requests ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">新用户</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.today_new_users ?? 0}</div>
          </CardContent>
        </Card>
      </div>

        {/* 图表：固定高度容器，确保正常渲染 */}
        {/* OverviewTab.tsx 图表部分修复*/}
<Card className="p-6">
  <h3 className="text-lg font-semibold mb-4">近7日数据趋势</h3>
  {/* 响应式高度：移动端降低高度 */}
  <div className="h-[250px] sm:h-[400px] w-full">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={daily} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" label={{ value: '活跃用户数', angle: -90, position: 'insideLeft' }} />
        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" label={{ value: '请求总数', angle: 90, position: 'insideRight' }} />
        <Tooltip />
        <Legend />
        <Line yAxisId="left" type="monotone" dataKey="users" stroke="#8884d8" name="活跃用户" activeDot={{ r: 8 }} />
        <Line yAxisId="right" type="monotone" dataKey="events" stroke="#82ca9d" name="请求总数" />
      </LineChart>
    </ResponsiveContainer>
  </div>
</Card>
    </div>
  )
}