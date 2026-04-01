import { useState, useEffect } from 'react'
import Form from '@rjsf/core'
import validator from '@rjsf/validator-ajv8'
import request from '@/api/request'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const schema = {
  type: 'object',
  title: '服务器列表配置',
  required: ['servers'],
  properties: {
    servers: {
      type: 'array',
      title: '服务器列表',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', title: '服务器名称' },
          url: { type: 'string', title: 'API 地址' },
          port: { type: 'number', title: '端口' },
          enabled: { type: 'boolean', title: '启用', default: true }
        }
      }
    }
  }
}

export default function ServerConfigPage() {
  const [data, setData] = useState({})

  useEffect(() => {
    request.get('/config/server').then(res => setData(res.data))
  }, [])

  const submit = async (d: any) => {
    await request.post('/config/server', d.formData)
    alert('保存成功！')
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">服务器列表配置</h2>
      <Form schema={schema} formData={data} validator={validator} onSubmit={submit}>
        <Button type="submit" className="mt-4">保存配置</Button>
      </Form>
    </Card>
  )
}