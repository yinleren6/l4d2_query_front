import { useState, useEffect } from 'react'
import Form from '@rjsf/core'
import validator from '@rjsf/validator-ajv8'
import request from '@/api/request'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const schema = {
  type: 'object',
  title: 'App 版本配置',
  required: ['version', 'update_url'],
  properties: {
    version: { type: 'string', title: '版本号' },
    update_url: { type: 'string', title: '更新地址' },
    force_update: { type: 'boolean', title: '强制更新', default: false },
    description: { type: 'string', title: '更新说明' }
  }
}

export default function AppVersionPage() {
  const [data, setData] = useState({})

  useEffect(() => {
    request.get('/config/version').then(res => setData(res.data))
  }, [])

  const submit = async (d: any) => {
    await request.post('/config/version', d.formData)
    alert('保存成功！')
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">App 版本配置</h2>
      <Form schema={schema} formData={data} validator={validator} onSubmit={submit}>
        <Button type="submit" className="mt-4">保存版本配置</Button>
      </Form>
    </Card>
  )
}