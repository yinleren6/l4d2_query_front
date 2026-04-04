// src/components/layout/Sidebar.tsx

import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface MenuItem {
    value: string
    label: string
    icon: React.ReactNode
    roles: string[]
}

interface SidebarProps {
    items: MenuItem[]
    activeTab: string
    onTabChange: (value: string) => void
    isOpen: boolean
    onClose: () => void
    userRole: string
}

export default function Sidebar({
    items,
    activeTab,
    onTabChange,
    isOpen,
    onClose,
    userRole,
}: SidebarProps) {
    // 根据用户角色过滤菜单项
    const accessibleItems = items.filter((item) =>
        item.roles.includes(userRole),
    )

    const handleItemClick = (value: string) => {
        onTabChange(value)
        // 移动端点击后自动关闭侧边栏
        if (window.innerWidth < 768) {
            onClose()
        }
    }

    return (
        <>
            {/* 移动端遮罩层 */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={onClose}
                />
            )}

            {/* 侧边栏容器 */}
            <aside
                className={cn(
                    'fixed top-0 left-0 z-50 w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-transform duration-300 ease-in-out md:relative md:translate-x-0',
                    'h-screen',
                    isOpen ? 'translate-x-0' : '-translate-x-full',
                )}
            >
                {/* 侧边栏头部 */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                        导航菜单
                    </h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="md:hidden"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* 菜单列表 */}
                <nav className="p-2 space-y-1 ">
                    {accessibleItems.map((item) => (
                        <button
                            key={item.value}
                            onClick={() => handleItemClick(item.value)}
                            className={cn(
                                'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                                activeTab === item.value
                                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
                                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700',
                            )}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    ))}
                </nav>
            </aside>
        </>
    )
}
