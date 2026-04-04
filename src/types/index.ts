// src/types/index.ts
import type { JSONSchema7 } from 'json-schema'

// 表单 Schema 类型（直接继承 JSONSchema7）
export type FormSchema = JSONSchema7

// 用户类型
export interface User {
    id: string      // 用户ID
    token: string   // JWT Token
    role: string    // 角色（admin / user）
}

// 服务器配置类型
export interface ServerItem {
    name: string
    url: string
}

export interface ServerFormData {
    version: string
    last_update: string
    changelog: string
    server_list: ServerItem[]
}

// App版本配置类型
export interface AppVersionFormData {
    app_version: string
    download_url: string
    last_update: string
    changelog: string
}

// 白名单类型（包含 Token）
export interface WhitelistItem {
    group_id: string   // 群组ID
    added_at: string   // 添加时间
    enabled: boolean   // 是否启用
    token: string      // 群组Token
}

// 统计总览数据类型
export interface OverviewStats {
    total_users: number
    today_active: number
    yesterday_active: number
    week_active: number
    today_requests: number
    yesterday_requests: number
    today_new_users: number
}

// 每日统计数据（用于趋势图）
export interface DailyStat {
    date: string   // 日期（YYYY-MM-DD）
    users: number  // 活跃用户数
    events: number // 请求总数
}