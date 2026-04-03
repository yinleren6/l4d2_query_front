import { useState, useEffect } from 'react'
import Form from '@rjsf/shadcn';
import validator from '@rjsf/validator-ajv8'
import request from '@/api/request'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ServerFormData ,FormSchema} from '@/types'
import { toast } from 'sonner'

// --- 1. 深度去除对象中所有字符串的首尾空格 ---
const deepTrim = (obj: any): any => {
  if (typeof obj === 'string') {
    return obj.trim()
  }
  if (Array.isArray(obj)) {
    return obj.map(deepTrim)
  }
  if (obj !== null && typeof obj === 'object') {
    const trimmedObj: any = {}
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) { // 新增：避免遍历原型链属性
        trimmedObj[key] = deepTrim(obj[key])
      }
    }
    return trimmedObj
  }
  return obj
}

// --- 2. 深度比较两个对象（判断内容是否变化）---
const isEqual = (obj1: any, obj2: any): boolean => {
  // 先转成 JSON 字符串比较（简单粗暴，适合配置场景）
  return JSON.stringify(obj1) === JSON.stringify(obj2)
}

export default function ServerConfigTab() {
  const [schema, setSchema] = useState<FormSchema | null>(null)
  const [formData, setFormData] = useState<ServerFormData | undefined>(undefined)
  const [originalData, setOriginalData] = useState<ServerFormData | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchData = async (signal?: AbortSignal) => {
    try {
      setLoading(true)
      setError('')
      const [schemaRes, dataRes] = await Promise.all([
        request.get('/api/update-schema', { signal }),
        request.get('/api/update-data', { signal }),
      ])
      setSchema(schemaRes.data)
      setFormData(dataRes.data)
      setOriginalData(dataRes.data)
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError('加载服务器配置失败，请刷新重试')
        toast.error('加载服务器配置失败') // 修正：提示文案和错误类型匹配
      }
      console.error('加载服务器配置失败:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    fetchData(controller.signal)
    return () => controller.abort()
  }, [])

  if (loading) return <div className="p-8 text-center">加载中...</div>
  if (error) return <div className="p-8 text-center text-destructive">{error}</div>
  if (!schema) return <div className="p-8 text-center">加载中...</div>

  const handleSubmit = async ({ formData: rawFormData }: { formData?: ServerFormData }) => {
    if (!rawFormData || submitting) return

    // --- 3. 第一步：去除所有首尾空格 ---
    const trimmedData = deepTrim(rawFormData)

    // --- 4. 第二步：前端预检查（和原始数据对比）---
    if (originalData && isEqual(trimmedData, deepTrim(originalData))) {
      toast.info('内容没有变化，无需保存')
      return
    }

    setSubmitting(true)
    try {
      // --- 5. 提交处理后的数据（trim过的）---
      const res = await request.post('/api/save', trimmedData)

      if (res.data) {
        setFormData(res.data)
        setOriginalData(res.data) // 更新原始数据为最新版本
        toast.success('✅ 服务器配置保存成功！版本已更新')
      }
    } catch (err: unknown) {
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
        liveValidate
      >
        <div className="mt-4">
          <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
            {submitting ? '保存中...' : '保存配置'}
          </Button>
        </div>
      </Form>
    </Card>
  )
}