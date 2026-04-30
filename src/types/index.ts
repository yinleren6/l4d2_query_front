// src/types/index.ts
import type { JSONSchema7 } from 'json-schema'
export type FormSchema = JSONSchema7

export interface AuthState {
  user: User | null
  setUser: (user: User) => void
  logout: () => void
}

export interface User {
  id: string
  jwtToken: string
  role: string
  refreshToken?: string;
}

export interface ServerItem {
  name: string
  url: string
}

export interface ServerFormData {
  version: number
  last_update: number
  changelog: string
  server_list: ServerItem[]
}

export interface AppVersionFormData {
  app_version: string;
  updater_version: string;
  last_update: string;
  changelog: string;
  download_url: string;
  installer_download_url: string;
  updater_download_url: string;
}

export interface LatestVersionInfo {
  frontVersion: string;
  frontBuildTime: string;
  backendVersion: string;
  backendBuildTime: string;
  force: boolean;
  message?: string;
}

export interface CurrentVersion {
  frontVersion: string;
  backendVersion: string;
  frontBuildTime: string;
  backendBuildTime: string;
}

export interface WhitelistItem {
  created_at: string
  enabled: boolean
  last_login: string
  user_id: string
  user_name: string;
}

export interface OverviewStats {
  today_web_requests: number
  today_page_requests: number
  total_web_requests: number
  total_users: number
  today_err_requests: number
  today_app_requests: number
  today_new_visitor: number
  total_app_users: number
}

export interface DailyStat {
  date: string
  users: number
  events: number
}