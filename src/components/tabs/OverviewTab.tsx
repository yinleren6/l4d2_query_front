import { useEffect, useState } from 'react'
import request from '@/api/request'
import { Card } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { OverviewStats, DailyStat } from '@/types'

export default function OverviewTab() {
  const [overview, setOverview] = useState<OverviewStats | null>(null)
  const [daily, setDaily] = useState<DailyStat[]>([])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [overviewRes, dailyRes] = await Promise.all([
          request.get('/api/stats/overview'),
          request.get('/api/stats/daily?days=7')
        ])
        setOverview(overviewRes.data)
        setDaily(dailyRes.data)
      } catch (err) {
        console.error('加载统计失败', err)
      }
    }
    fetchStats()
  }, [])

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">统计总览</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 border rounded-lg">
          <p className="text-sm text-slate-500">总用户数</p>
          <p className="text-2xl font-bold">{overview?.total_users ?? 0}</p>
        </div>
        <div className="p-4 border rounded-lg">
          <p className="text-sm text-slate-500">今日活跃</p>
          <p className="text-2xl font-bold">{overview?.today_active ?? 0}</p>
        </div>
        <div className="p-4 border rounded-lg">
          <p className="text-sm text-slate-500">今日请求</p>
          <p className="text-2xl font-bold">{overview?.today_requests ?? 0}</p>
        </div>
        <div className="p-4 border rounded-lg">
          <p className="text-sm text-slate-500">新用户</p>
          <p className="text-2xl font-bold">{overview?.today_new_users ?? 0}</p>
        </div>
      </div>
      <div className="h-64 border rounded-lg">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={daily}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Line yAxisId="left" type="monotone" dataKey="users" stroke="#8884d8" name="活跃用户" />
            <Line yAxisId="right" type="monotone" dataKey="events" stroke="#82ca9d" name="请求总数" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}