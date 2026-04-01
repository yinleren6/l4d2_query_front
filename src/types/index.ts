export interface User {
    id: string
    token: string
}

export interface LoginData {
    id: string
    password: string
}

export interface ServerConfig {
    name: string
    url: string
    port: number
    enabled: boolean
}

export interface AppVersionConfig {
    version: string
    update_url: string
    force_update: boolean
    description: string
}