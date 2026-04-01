import { useState, useEffect } from 'react'
import Form from '@rjsf/core'
import validator from '@rjsf/validator-ajv8'
import request from '@/api/request'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AppVersionFormData } from '@/types'

export default function AppVersionTab() {
  const [schema, setSchema] = useState<any>(null)
  const [formData, setFormData] = useState<AppVersionFormData | undefined>(undefined)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [schemaRes, dataRes] = await Promise.all([
          request.get('/api/version-schema'),
          request.get('/api/version'),
        ])
        setSchema(schemaRes.data)
        setFormData(dataRes.data)
      } catch (err) {
        console.error('加载版本配置失败:', err)
      }
    }
    loadData()
  }, [])

  const handleSubmit = async ({ formData }: { formData?: AppVersionFormData }) => {
    if (!formData) return
    try {
      await request.post('/api/version-save', formData)
      alert('✅ App版本配置保存成功！')
    } catch (err) {
      console.error('保存失败:', err)
      alert('❌ 保存失败')
    }
  }

  if (!schema) return <div className="p-8 text-center">加载中...</div>

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">App版本配置</h2>
      <Form
        schema={schema}
        formData={formData}
        validator={validator}
        onSubmit={({ formData }) => handleSubmit({ formData })}
      >
        <Button type="submit" className="mt-4">保存版本配置</Button>
      </Form>
    </Card>
  )
}