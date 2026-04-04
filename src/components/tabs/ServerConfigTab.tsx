// src/components/tabs/ServerConfigTab.tsx
import { useState, useEffect, useCallback, useRef } from 'react'
import Form from '@rjsf/shadcn'
import validator from '@rjsf/validator-ajv8'
import request from '@/api/request'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ServerFormData, FormSchema } from '@/types'
import { toast } from 'sonner'
import { deepTrim, isEqual, formatTime } from '@/lib/utils'

export default function ServerConfigTab() {
    const [schema, setSchema] = useState<FormSchema | null>(null)
    const [formData, setFormData] = useState<ServerFormData | undefined>(
        undefined,
    )
    const [originalData, setOriginalData] = useState<
        ServerFormData | undefined
    >(undefined)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const getDefaultConfig = useCallback((): ServerFormData => {
        return {
            version: 0,
            last_update: formatTime(),
            server_list: [],
        } as unknown as ServerFormData
    }, [])

    const fetchData = useCallback(
        async (signal?: AbortSignal) => {
            if (mountedRef.current) {
                setLoading(false)
            }
            try {
                setLoading(true)
                setError('')
                const [schemaRes, dataRes] = await Promise.all([
                    request.get('/api/config-schema', { signal }),
                    request.get('/api/get-user-config', { signal }),
                ])

                // 空数据自动填充默认值，绝对不会为空
                const hasValidData =
                    dataRes.data &&
                    typeof dataRes.data === 'object' &&
                    ('version' in dataRes.data || 'server_list' in dataRes.data)
                const configData = hasValidData
                    ? dataRes.data
                    : getDefaultConfig()
                // const configData = dataRes.data || getDefaultConfig()

                setSchema(schemaRes.data)
                setFormData(configData)
                setOriginalData(configData)
            } catch (err: unknown) {
                if (err instanceof Error && err.name !== 'AbortError') {
                    setError('加载失败，请刷新重试')
                    toast.error('加载服务器配置失败')
                }
            } finally {
                setLoading(false)
            }
        },
        [getDefaultConfig],
    )

    const mountedRef = useRef(true)
    useEffect(() => {
        mountedRef.current = true

        const controller = new AbortController()
        fetchData(controller.signal)
        return () => {
            mountedRef.current = false
            controller.abort()
        }
    }, [fetchData])

    // ✅ 提交时强制赋值中文字段，杜绝校验报错
    const handleSubmit = async ({
        formData: rawFormData,
    }: {
        formData?: ServerFormData
    }) => {
        console.log('【日志4】提交前表单原始数据=', rawFormData)
        if (!rawFormData || submitting) return

        const trimmedData = deepTrim(rawFormData)

        // 关键：强制赋值必填中文字段
        const finalData = {
            ...trimmedData,
            version: trimmedData['version'] || '0',
            last_update: formatTime(),
            server_list: trimmedData['server_list'] || [],
        }

        // 无修改不提交
        if (originalData && isEqual(finalData, deepTrim(originalData))) {
            toast.info('内容无变化，无需保存')
            return
        }

        setSubmitting(true)
        try {
            const res = await request.post('/api/save-user-config', finalData)
            if (res.data) {
                setFormData(res.data)
                setOriginalData(res.data)
                toast.success('保存成功！')
            }
        } catch (err) {
            console.error('保存失败:', err)
            toast.error('保存失败，请检查')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) return <div className="p-8 text-center">加载中...</div>
    if (error)
        return <div className="p-8 text-center text-destructive">{error}</div>
    if (!schema) return <div className="p-8 text-center">加载中...</div>

    return (
        <Card className="p-6 animate-fade-slide">
            <h2 className="text-lg font-semibold mb-4">服务器列表配置</h2>
            <Form
                schema={schema}
                formData={formData}
                validator={validator}
                onSubmit={({ formData }) => handleSubmit({ formData })}
                liveValidate
            >
                <div className="mt-4">
                    <Button
                        type="submit"
                        className="w-full sm:w-auto"
                        disabled={submitting}
                    >
                        {submitting ? '保存中...' : '保存配置'}
                    </Button>
                </div>
            </Form>
        </Card>
    )
}
