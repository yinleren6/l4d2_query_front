// src/types/index.ts
import type { JSONSchema7 } from 'json-schema'

// 表单 Schema 类型（直接继承 JSONSchema7）
export type FormSchema = JSONSchema7

export interface AuthState {
  user: User | null
  setUser: (user: User) => void
  logout: () => void
}

// 用户类型
export interface User {
  id: string      // 用户ID
  jwtToken: string   // JWT Token
  role: string    // 角色（admin / user）
  refreshToken?: string;
}

// 服务器配置类型
export interface ServerItem {
  name: string
  url: string
}

export interface ServerFormData {
  version: number
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

// 列表类型（包含 Token）
export interface WhitelistItem {
  created_at: string      // 创建时间
  enabled: boolean   // 是否启用
  last_login: string // 最后登录时间
  user_id: string   // 群组ID
  user_name: string; // 用户名
}

// 统计总览数据类型
export interface OverviewStats {
  today_web_requests: number// 今日 Web 请求数
  today_page_requests: number// 今日 查询 请求数
  total_web_requests: number// 总请求数（Web）
  total_users: number// 注册用户数（Web）
  today_err_requests: number // 今日错误请求数（Web 日志中 status=0 的记录）
  today_app_requests: number // 今日App请求数
  today_new_visitor: number// 今日新访客(public)
  total_app_users: number // 注册用户数（App）
}

// 每日统计数据（用于趋势图）
export interface DailyStat {
  date: string   // 日期（YYYY-MM-DD）
  users: number  // 活跃用户数
  events: number // 请求总数
}