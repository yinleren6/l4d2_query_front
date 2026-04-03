import { useState, useEffect } from 'react'
import Form from '@rjsf/shadcn'
import validator from '@rjsf/validator-ajv8'
import request from '@/api/request'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ServerFormData, FormSchema } from '@/types'
import { toast } from 'sonner'

// 工具函数：去空格
const deepTrim = (obj: any): any => {
    if (typeof obj === 'string') return obj.trim()
    if (Array.isArray(obj)) return obj.map(deepTrim)
    if (obj !== null && typeof obj === 'object') {
        const trimmedObj: any = {}
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                trimmedObj[key] = deepTrim(obj[key])
            }
        }
        return trimmedObj
    }
    return obj
}

// 工具函数：对比数据
const isEqual = (obj1: any, obj2: any): boolean => {
    return JSON.stringify(obj1) === JSON.stringify(obj2)
}

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

    // 生成你要的 10 位时间格式：YYMMDDHHmm
    const formatTime = () => {
        const now = new Date()
        const pad = (num: number) => num.toString().padStart(2, '0')
        const year = pad(now.getFullYear() % 100)
        const month = pad(now.getMonth() + 1)
        const day = pad(now.getDate())
        const hour = pad(now.getHours())
        const minute = pad(now.getMinutes())
        console.log(
            '【日志1】生成的时间戳=',
            year + month + day + hour + minute,
        )
        return year + month + day + hour + minute
    }

    useEffect(() => {
        // ✅ 终极修复：严格匹配你表单的【中文字段名】
        const getDefaultConfig = (): ServerFormData => {
            console.log('【日志2】自动生成的默认表单数据=', {
                服务器列表版本: 0,
                最后更新时间: formatTime(),
            })
            return {
                服务器列表版本: 0,
                最后更新时间: formatTime(),
            } as unknown as ServerFormData
        }

        const fetchData = async (signal?: AbortSignal) => {
            try {
                setLoading(true)
                setError('')
                console.log('开始请求数据')
                const [schemaRes, dataRes] = await Promise.all([
                    request.get('/api/update-schema', { signal }),
                    request.get('/api/update-data', { signal }),
                ])

                // 空数据自动填充默认值，绝对不会为空
                const configData = dataRes.data || getDefaultConfig()
                console.log('【日志3】最终渲染表单的数据=', configData)
                setSchema(schemaRes.data)
                setFormData(configData)
                setOriginalData(configData)
            } catch (err: unknown) {
                if (err instanceof Error && err.name !== 'AbortError') {
                    setError('加载失败，请刷新重试')
                    toast.error('加载服务器配置失败')
                }
                console.error('加载错误:', err)
            } finally {
                setLoading(false)
            }
        }

        const controller = new AbortController()
        fetchData(controller.signal)
        return () => controller.abort()
    }, [])

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
            服务器列表版本: trimmedData['服务器列表版本'] || 0,
            最后更新时间: formatTime(),
        } as ServerFormData

        // 无修改不提交
        if (originalData && isEqual(finalData, deepTrim(originalData))) {
            toast.info('内容无变化，无需保存')
            return
        }

        setSubmitting(true)
        try {
            const res = await request.post('/api/save', finalData)
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

    // ==============================================
    // ✅ 完全保留你原版的 return 渲染代码！一字未改！
    // ==============================================
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
