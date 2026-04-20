import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'fs'
import { execSync } from 'child_process'

const getGitInfo = () => {
  try {
    // 获取总提交次数（作为 build 号）
    const commitCount = execSync('git rev-list --count HEAD', { encoding: 'utf-8' }).trim()
    // 获取当前 commit 的短哈希（前 8 位）
    const shortHash = execSync('git rev-parse --short=8 HEAD', { encoding: 'utf-8' }).trim()
    return { commitCount, shortHash }
  } catch (error) {
    console.warn('⚠️ 无法获取 Git 信息，使用 fallback 值', error)
    return { commitCount: '0', shortHash: '00000000' }
  }
}

const generateVersionPlugin = () => {
  let backupVersionData: Record<string, unknown> | null = null
  return {
    name: 'generate-version',
    apply: 'build',
    buildStart() {
      const distVersionPath = path.resolve(__dirname, 'dist', 'version.json')
      if (fs.existsSync(distVersionPath)) {
        try {
          const raw = fs.readFileSync(distVersionPath, 'utf-8')
          backupVersionData = JSON.parse(raw)
        } catch (e) {
          console.warn('[版本插件] 备份现有版本文件失败，将忽略', e)
          backupVersionData = null
        }
      } else {
        backupVersionData = null
      }
    },


    writeBundle() {
      const buildTime = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
      const { commitCount, shortHash } = getGitInfo()
      let patch = parseInt(commitCount, 10)
      if (isNaN(patch)) {
        console.warn('⚠️ Git commitCount 无效，使用 0')
        patch = 0
      }
      const rootVersionPath = path.resolve(__dirname, 'version.json')
      let major = 0, minor = 0
      if (fs.existsSync(rootVersionPath)) {
        try {
          const raw = fs.readFileSync(rootVersionPath, 'utf-8')
          const data = JSON.parse(raw)
          major = typeof data.major === 'number' ? data.major : 0
          minor = typeof data.minor === 'number' ? data.minor : 0
        } catch (e) {
          console.warn('⚠️ 读取 major/minor 失败，使用默认值',e)
        }
      }
      const fullVersion = `v${major}.${minor}.${patch}.${shortHash}`
      const frontendFields = {
        frontVersion: fullVersion,
        frontBuildTime: buildTime
      }
      let finalData = {}
      if (backupVersionData && typeof backupVersionData === 'object') {
        finalData = { ...backupVersionData }
      }
      Object.assign(finalData, frontendFields)
      // 写入 dist/version.json
      const distDir = path.resolve(__dirname, 'dist')
      if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true })
      const distVersionPath = path.join(distDir, 'version.json')
      fs.writeFileSync(distVersionPath, JSON.stringify(finalData, null, 2), 'utf-8')
      // 控制台输出
      console.log('\n📋 版本更新完成')
      console.log(`frontVersion: ${fullVersion}`)
      console.log(`frontBuildTime: ${buildTime}`)
      console.log(`📁 dist/version.json 已生成`)
    }
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
})