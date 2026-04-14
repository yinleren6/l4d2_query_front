import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'

const generateVersionPlugin = () => {
  // 用于在构建过程中暂存原有的 dist/version.json 内容
  let backupVersionData = {} as any

  return {
    name: 'generate-version',
    apply: 'build',

    // 在构建开始前备份现有的 dist/version.json
    buildStart() {
      const distVersionPath = path.resolve(__dirname, 'dist', 'version.json')
      if (fs.existsSync(distVersionPath)) {
        try {
          const raw = fs.readFileSync(distVersionPath, 'utf-8')
          backupVersionData = JSON.parse(raw)
          console.log('[版本插件] 已备份现有的 dist/version.json')
        } catch (e) {
          console.warn('[版本插件] 备份现有版本文件失败，将忽略', e)
          backupVersionData = null
        }
      } else {
        backupVersionData = null
      }
    },

    // 构建完成后生成新的 dist/version.json（合并备份中的后端字段）
    closeBundle() {
      // ========== 1. 处理根目录 version.json（存储 major/minor/patch） ==========
      const rootVersionPath = path.resolve(__dirname, 'version.json')

      const defaultData = {
        major: 1,
        minor: 0,
        patch: 0,
        version: 'v1.0.0.00000000',
        buildTime: new Date().toLocaleString('zh-CN')
      }

      let versionData
      if (fs.existsSync(rootVersionPath)) {
        try {
          const raw = fs.readFileSync(rootVersionPath, 'utf-8')
          versionData = JSON.parse(raw)
          if (typeof versionData.major !== 'number') versionData.major = defaultData.major
          if (typeof versionData.minor !== 'number') versionData.minor = defaultData.minor
          if (typeof versionData.patch !== 'number') versionData.patch = defaultData.patch
        } catch (e) {
          console.warn('⚠️ 根目录 version.json 解析失败，使用默认配置', e)
          versionData = { ...defaultData }
        }
      } else {
        versionData = { ...defaultData }
      }

      // 自增 patch
      versionData.patch += 1

      // 生成 8 位十六进制哈希
      let hash
      try {
        hash = crypto.randomBytes(4).toString('hex')
      } catch (e) {
        hash = Math.random().toString(16).slice(2, 10).padEnd(8, '0')
      }

      const fullVersion = `v${versionData.major}.${versionData.minor}.${versionData.patch}.${hash}`
      const buildTime = new Date().toLocaleString('zh-CN')

      // 记录旧版本（用于打印）
      const oldVersion = versionData.version || '无'
      const oldBuildTime = versionData.buildTime || '无'

      // 更新根目录数据
      versionData.version = fullVersion
      versionData.buildTime = buildTime
      fs.writeFileSync(rootVersionPath, JSON.stringify(versionData, null, 2), 'utf-8')
      console.log(`\n📁 根目录 version.json 已更新 (major=${versionData.major}, minor=${versionData.minor}, patch=${versionData.patch})`)

      // ========== 2. 生成新的 dist/version.json（合并备份中的后端字段） ==========
      const distDir = path.resolve(__dirname, 'dist')
      if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir, { recursive: true })
      }

      // 准备前端版本字段
      const frontendFields = {
        Frontversion: fullVersion,
        FrontbuildTime: buildTime
      }

      // 最终要写入的对象：先复制备份中的内容（保留后端字段），再覆盖/添加前端字段
      let finalData = {}
      if (backupVersionData && typeof backupVersionData === 'object') {
        // 保留备份中的所有字段
        finalData = { ...backupVersionData }
        console.log('[版本插件] 检测到备份数据，将保留其中的后端字段')
      }

      // 将前端字段合并进去（如果字段已存在则覆盖，不存在则添加）
      Object.assign(finalData, frontendFields)

      const distVersionPath = path.join(distDir, 'version.json')
      fs.writeFileSync(distVersionPath, JSON.stringify(finalData, null, 2), 'utf-8')

      // 控制台输出
      console.log('\n📋 版本更新完成')
      console.log(`Frontversion: ${oldVersion} --> ${fullVersion}`)
      console.log(`FrontbuildTime: ${oldBuildTime} --> ${buildTime}`)
      if (backupVersionData) {
        console.log('✅ 已保留原有后端字段（backendVersion, backendBuildTime 等）')
      }
      console.log(`📁 dist/version.json 已生成\n`)
    },
  }
}

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') ||
            id.includes('node_modules/react-dom') ||
            id.includes('node_modules/react-router-dom')) {
            return 'react-vendor'
          }
          if (id.includes('node_modules/@rjsf')) return 'ui-vendor'
          if (id.includes('node_modules/recharts')) return 'recharts-vendor'
          if (id.includes('node_modules/axios') ||
            id.includes('node_modules/zustand') ||
            id.includes('node_modules/sonner') ||
            id.includes('node_modules/next-themes')) {
            return 'utils-vendor'
          }
          return undefined
        },
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    generateVersionPlugin()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api': { target: 'http://l.test.cn:8999', changeOrigin: true },
      '/p': {
        target: 'http://l.test.cn:8999',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})