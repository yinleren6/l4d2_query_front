// // src/pages/NotFound.tsx
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'

export default function NotFound() {
    const navigate = useNavigate()
    return (
        <div className="min-h-screen flex flex-col items-center justify-center">
            <h1 className="text-4xl font-bold mb-4">404</h1>
            <p className="text-muted-foreground mb-6">页面不存在</p>
            <Button onClick={() => navigate('/')}>返回首页</Button>
        </div>
    )
}
