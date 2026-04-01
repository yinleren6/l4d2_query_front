import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import request from '@/api/request'
import { Card } from '@/components/ui/card'

export default function OverviewPage() {
  const [data, setData] = useState([])

  useEffect(() => {
    request.get('/stats/daily').then(res => setData(res.data))
  }, [])

  return (
    <Card className="p-4">
      <h2 className="text-xl mb-4">统计总览</h2>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="active_users" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}