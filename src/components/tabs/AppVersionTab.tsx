import { useState, useEffect } from 'react'
import Form from '@rjsf/core'
import validator from '@rjsf/validator-ajv8'
import request from '@/api/request'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AppVersionFormData, FormSchema } from '@/types'
import { toast } from 'sonner'

export default function AppVersionTab() {
  const [schema, setSchema] = useState<FormSchema | null>(null)
  const [formData, setFormData] = useState<AppVersionFormData | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false) // 新增提交状态

  useEffect(() => {
    const controller = new AbortController()
    const loadData = async () => {
      try {
        setLoading(true)
        setError('')
        const [schemaRes, dataRes] = await Promise.all([
          request.get('/api/version-schema',{ signal: controller.signal }),
          request.get('/api/version',{ signal: controller.signal }),

        ])
        setSchema(schemaRes.data)
        setFormData(dataRes.data)
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError('加载版本配置失败，请刷新重试')
          toast.error('加载版本配置失败')
        }
        console.error('加载版本配置失败:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
    // if (controller.signal.aborted) return;
    return () => controller.abort()
  }, [])

  if (loading) return <div className="p-8 text-center">加载中...</div>
  if (error) return <div className="p-8 text-center text-destructive">{error}</div>
  if (!schema) return <div className="p-8 text-center">加载中...</div>

  const handleSubmit = async ({ formData }: { formData?: AppVersionFormData }) => {
    if (!formData || submitting) return
    setSubmitting(true) // 新增禁用状态
    try {
      await request.post('/api/version-save', formData)
      toast.success('✅ App版本配置保存成功！')
    } catch (err: unknown) {
      console.error('保存失败:', err)
      toast.error('❌ 保存失败')
    } finally {
      setSubmitting(false) // 恢复状态
    }
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">App版本配置</h2>
      <Form
        schema={schema}
        formData={formData}
        validator={validator}
        onSubmit={({ formData }) => handleSubmit({ formData })}
      >
        <div className="mt-4"> {/* 统一间距 */}
          <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
            {submitting ? '保存中...' : '保存版本配置'}
          </Button>
        </div>
      </Form>
    </Card>
  )
}