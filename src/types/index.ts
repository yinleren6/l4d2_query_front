// 用户类型
export interface User {
    id: string
    token: string
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
export interface WhitelistItem {
    user_id: string
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
    date: string
    users: number
    events: number
}

