import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {

          // // 将 React 全家桶打包到一起
          if (id.includes('node_modules/react') ||
            id.includes('node_modules/react-dom') ||
            id.includes('node_modules/react-dom') ||
            id.includes('node_modules/react-router-dom')) {
            return 'react-vendor' // 245.60 kB
          }
          // // // 将 UI 库和图表库打包到一起
          if (id.includes('node_modules/@rjsf')) return 'ui-vendor' //400.85 kB
          if (id.includes('node_modules/recharts')) return 'recharts-vendor' //346.99 kB

          // // 将其他工具库打包到一起
          if (id.includes('node_modules/axios') ||
            id.includes('node_modules/zustand') ||
            id.includes('node_modules/sonner') ||
            id.includes('node_modules/next-themes')) {
            return 'utils-vendor'//69.32 kB
          }
          // console.log(id)
          // 其他模块保持默认行为
          return undefined
        },
      },
    },
    // 可选：提高警告阈值（不推荐，但可暂时缓解警告）
    // chunkSizeWarningLimit: 500,
  },
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    proxy: {
      '/p': {
        target: 'http://l.test.cn:8999',
        changeOrigin: true,
        rewrite: (path) => path,
        secure: false,
      },
      '/': {
        target: 'http://l.test.cn:8999',// 后端地址
        changeOrigin: true,
        rewrite: (path) => path,
        secure: false, // 非HTTPS关闭安全校验
      },
    },
  },
})