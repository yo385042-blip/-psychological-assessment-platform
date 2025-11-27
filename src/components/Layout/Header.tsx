/**
 * 页面头部组件
 * 包含主题切换、用户信息等
 */

import { Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import ThemeToggle from '@/components/ThemeToggle'

export default function Header() {
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* 可以在这里添加搜索框或其他功能 */}
        </div>
        
        <div className="flex items-center gap-4">
          {user && (
            <div className="hidden sm:flex flex-col items-end text-sm">
              <span className="font-medium text-gray-900 dark:text-white">
                {user.name || user.username}
              </span>
              <span className="text-gray-500 dark:text-gray-400">{user.role === 'admin' ? '管理员' : '普通用户'}</span>
            </div>
          )}
          {/* 主题切换 */}
          <ThemeToggle />

          {/* 通知 */}
          <button
            onClick={() => navigate('/notifications')}
            className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="通知"
            aria-label="通知"
          >
            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            {/* 可以在这里添加未读数量角标 */}
          </button>
        </div>
      </div>
    </header>
  )
}

