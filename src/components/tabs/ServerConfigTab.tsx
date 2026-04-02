import { useState, useEffect } from 'react'
import Form from '@rjsf/core'
import validator from '@rjsf/validator-ajv8'
import request from '@/api/request'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ServerFormData ,FormSchema} from '@/types'
import { toast } from 'sonner'
export default function ServerConfigTab() {
    // 组件中使用
    const [schema, setSchema] = useState<FormSchema | null>(null)
    const [formData, setFormData] = useState<ServerFormData | undefined>(undefined)
  // 示例：OverviewTab.tsx
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)


  useEffect(() => {
    const controller = new AbortController() // 创建控制器
    const loadData = async () => {
      try {setLoading(true)
        setError('')
        const [schemaRes, dataRes] = await Promise.all([
          request.get('/api/update-schema',{ signal: controller.signal }),
          request.get('/api/update-data',{ signal: controller.signal }), //TODO 改为 id
        ])
        setSchema(schemaRes.data)
        setFormData(dataRes.data)
      } catch (err:unknown) {if (err instanceof Error && err.name !== 'AbortError') {
        setError('加载服务器配置失败，请刷新重试')
        toast.error('加载统计数据失败')
      }
        console.error('加载服务器配置失败:', err)
      }finally{setLoading(false)}
    }
    loadData()
    // if (controller.signal.aborted) return;
    return () => controller.abort() // 卸载时取消请求
  }, [])
  // 渲染逻辑
  if (loading) return <div className="p-8 text-center">加载中...</div>
  if (error) return <div className="p-8 text-center text-destructive">{error}</div>


  if (!schema) return <div className="p-8 text-center">加载中...</div>


  const handleSubmit = async ({ formData }: { formData?: ServerFormData }) => {
    if (!formData || submitting) return
    setSubmitting(true)
    try {
      await request.post('/api/save', formData)
      toast.success('✅ 服务器配置保存成功！')
    } catch (err:unknown) {
      console.error('保存失败:', err)
      toast.error('❌ 保存失败，请检查服务器状态')
    } finally {
      setSubmitting(false)
    }
  }
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">服务器列表配置</h2>

<Form
  schema={schema}
  formData={formData}
  validator={validator}
  onSubmit={({ formData }) => handleSubmit({ formData })}
>
  <div className="mt-4"> {/* 包裹按钮，统一间距 */}
    <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
      {submitting ? '保存中...' : '保存配置'}
    </Button>
  </div>
</Form>
    </Card>
  )
}