import { useState, useEffect } from 'react'
import Form from '@rjsf/core'
import validator from '@rjsf/validator-ajv8'
import request from '@/api/request'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

// 你的 JSON Schema 直接放这里
const schema = {
  type: 'object',
  required: ['app_name', 'api_base_url'],
  properties: {
    app_name: { type: 'string', title: '应用名称' },
    api_base_url: { type: 'string', title: 'API 地址' },
    timeout: { type: 'number', title: '超时时间(ms)', default: 5000 },
  },
}

export default function ConfigPage() {
  const [formData, setFormData] = useState({})

  useEffect(() => {
    request.get('/config').then(res => setFormData(res.data))
  }, [])

  const handleSubmit = (data: any) => {
    request.post('/config', data.formData).then(() => {
      alert('保存成功')
    })
  }

  return (
    <Card className="p-4">
      <h2 className="text-xl mb-4">配置编辑</h2>
      <Form
        schema={schema}
        formData={formData}
        validator={validator}
        onSubmit={handleSubmit}
      >
        <Button type="submit">保存配置</Button>
      </Form>
    </Card>
  )
}