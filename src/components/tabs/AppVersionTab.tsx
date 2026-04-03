import { useState, useEffect } from 'react'
import Form from '@rjsf/shadcn';
import validator from '@rjsf/validator-ajv8'
import request from '@/api/request'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AppVersionFormData, FormSchema } from '@/types'
import { toast } from 'sonner'

// --- 新增：深度去除对象中所有字符串的首尾空格 ---
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
      trimmedObj[key] = deepTrim(obj[key])
    }
    return trimmedObj
  }
  return obj
}

// --- 新增：深度比较两个对象（判断内容是否变化）---
const isEqual = (obj1: any, obj2: any): boolean => {
  return JSON.stringify(obj1) === JSON.stringify(obj2)
}

export default function AppVersionTab() {
  const [schema, setSchema] = useState<FormSchema | null>(null)
  const [formData, setFormData] = useState<AppVersionFormData | undefined>(undefined)
  const [originalData, setOriginalData] = useState<AppVersionFormData | undefined>(undefined) // 新增：保存原始数据用于对比
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

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
        setOriginalData(dataRes.data) // 新增：保存原始数据
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
    return () => controller.abort()
  }, [])

  if (loading) return <div className="p-8 text-center">加载中...</div>
  if (error) return <div className="p-8 text-center text-destructive">{error}</div>
  if (!schema) return <div className="p-8 text-center">加载中...</div>

  const handleSubmit = async ({ formData: rawFormData }: { formData?: AppVersionFormData }) => {
    if (!rawFormData || submitting) return

    // --- 新增：1. 去除所有字符串首尾空格 ---
    const trimmedData = deepTrim(rawFormData)

    // --- 新增：2. 对比原始数据，无变化则不提交 ---
    if (originalData && isEqual(trimmedData, deepTrim(originalData))) {
      toast.info('内容没有变化，无需保存')
      return
    }

    setSubmitting(true)
    try {
      // --- 新增：提交处理后的去空格数据 ---
      await request.post('/api/version-save', trimmedData)
      // 更新原始数据为最新版本（避免后续重复提交提示）
      setOriginalData(trimmedData)
      toast.success('✅ App版本配置保存成功！')
    } catch (err: unknown) {
      console.error('保存失败:', err)
      toast.error('❌ 保存失败')
    } finally {
      setSubmitting(false)
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
        liveValidate // 新增：实时验证（可选，和ServerConfigTab保持一致）
      >
        <div className="mt-4">
          <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
            {submitting ? '保存中...' : '保存版本配置'}
          </Button>
        </div>
      </Form>
    </Card>
  )
}