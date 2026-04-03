import { useState, useEffect, useCallback, useRef } from 'react'
import Form from '@rjsf/shadcn'
import validator from '@rjsf/validator-ajv8'
import request from '@/api/request'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AppVersionFormData, FormSchema } from '@/types'
import { toast } from 'sonner'

// 深度去除对象中所有字符串的首尾空格
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

// 深度比较两个对象（内容是否相等）
const isEqual = (obj1: any, obj2: any): boolean => {
    return JSON.stringify(obj1) === JSON.stringify(obj2)
}

export default function AppVersionTab() {
    const [schema, setSchema] = useState<FormSchema | null>(null)
    const [formData, setFormData] = useState<AppVersionFormData | undefined>(
        undefined,
    )
    const [originalData, setOriginalData] = useState<
        AppVersionFormData | undefined
    >(undefined)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const mountedRef = useRef(true)

    const loadData = useCallback(async (signal?: AbortSignal) => {
        try {
            setLoading(true)
            setError('')
            const [schemaRes, dataRes] = await Promise.all([
                request.get('/api/version-schema', { signal }),
                request.get('/api/version', { signal }),
            ])
            if (!mountedRef.current) return
            setSchema(schemaRes.data)
            setFormData(dataRes.data)
            setOriginalData(dataRes.data)
        } catch (err: unknown) {
            if (!mountedRef.current) return
            // 忽略取消请求的错误
            if (err instanceof Error && err.name === 'AbortError') return
            // 其他错误
            const errorMsg = '加载版本配置失败，请刷新重试'
            setError(errorMsg)
            toast.error(errorMsg)
            console.error('加载版本配置失败:', err)
        } finally {
            if (mountedRef.current) setLoading(false)
        }
    }, [])

    useEffect(() => {
        mountedRef.current = true
        const controller = new AbortController()
        loadData(controller.signal)
        return () => {
            mountedRef.current = false
            controller.abort()
        }
    }, [loadData])

    if (loading) return <div className="p-8 text-center">加载中...</div>
    if (error)
        return <div className="p-8 text-center text-destructive">{error}</div>
    if (!schema) return <div className="p-8 text-center">加载中...</div>

    const handleSubmit = async ({
        formData: rawFormData,
    }: {
        formData?: AppVersionFormData
    }) => {
        if (!rawFormData || submitting) return

        const trimmedData = deepTrim(rawFormData)

        // 无变化则跳过提交
        if (originalData && isEqual(trimmedData, deepTrim(originalData))) {
            toast.info('内容没有变化，无需保存')
            return
        }

        setSubmitting(true)
        try {
            await request.post('/api/version-save', trimmedData)
            if (!mountedRef.current) return
            setOriginalData(trimmedData)
            toast.success('✅ App版本配置保存成功！')
        } catch (err: unknown) {
            console.error('保存失败:', err)
            if (mountedRef.current) {
                toast.error('❌ 保存失败，请重试')
            }
        } finally {
            if (mountedRef.current) setSubmitting(false)
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
                liveValidate
            >
                <div className="mt-4">
                    <Button
                        type="submit"
                        className="w-full sm:w-auto"
                        disabled={submitting}
                    >
                        {submitting ? '保存中...' : '保存版本配置'}
                    </Button>
                </div>
            </Form>
        </Card>
    )
}
