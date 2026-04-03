// @/types/index.ts
import type { JSONSchema7 } from 'json-schema'

// 直接让FormSchema继承JSONSchema7，完美兼容
export type FormSchema = JSONSchema7


// 可在 @/types/index.ts 中扩展
// export interface FormSchema {
//     type: string
//     properties: Record<string, any> // 可根据实际 Schema 结构细化
//     required?: string[]
// }

// 用户类型

export interface User {
    id: string
    token: string   // 存储 JWT
    role: string
}

// 服务器配置类型
export interface ServerItem {
    name: string
    url: string
    port: number
    enabled: boolean
}

export interface ServerFormData {
    servers: ServerItem[]
}

// App版本配置类型
export interface AppVersionFormData {
    version: string
    update_url: string
    force_update: boolean
    desc: string
}

// 白名单类型
// 白名单类型（对应后端 /api/admin/groups 返回）
export interface WhitelistItem {
    group_id: string   // 原 user_id
    added_at: string
    enabled: boolean
}

export interface OverviewStats {
    total_users: number
    today_active: number
    yesterday_active: number
    week_active: number
    today_requests: number
    yesterday_requests: number
    today_new_users: number
}

export interface DailyStat {
    date: string;
    users: number;      // 活跃用户数
    events: number;     // 请求总数
}

