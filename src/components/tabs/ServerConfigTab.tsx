import { useState, useEffect } from 'react'
import Form from '@rjsf/core'
import validator from '@rjsf/validator-ajv8'
import request from '@/api/request'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ServerFormData } from '@/types'

export default function ServerConfigTab() {
  const [schema, setSchema] = useState<any>(null)
  const [formData, setFormData] = useState<ServerFormData | undefined>(undefined)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [schemaRes, dataRes] = await Promise.all([
          request.get('/api/update-schema'),
          request.get('/api/update-data'),
        ])
        setSchema(schemaRes.data)
        setFormData(dataRes.data)
      } catch (err) {
        console.error('加载服务器配置失败:', err)
      }
    }
    loadData()
  }, [])

  const handleSubmit = async ({ formData }: { formData?: ServerFormData }) => {
    if (!formData) return
    try {
      await request.post('/api/save', formData)
      alert('✅ 服务器配置保存成功！')
    } catch (err) {
      console.error('保存失败:', err)
      alert('❌ 保存失败，请检查服务器状态')
    }
  }

  if (!schema) return <div className="p-8 text-center">加载中...</div>

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">服务器列表配置</h2>
      <Form
        schema={schema}
        formData={formData}
        validator={validator}
        onSubmit={({ formData }) => handleSubmit({ formData })}
      >
        <Button type="submit" className="mt-4">保存配置</Button>
      </Form>
    </Card>
  )
}