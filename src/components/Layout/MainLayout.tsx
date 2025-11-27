import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import PageTransition from '@/components/PageTransition'

export default function MainLayout() {
  // 启用全局键盘快捷键
  useKeyboardShortcuts()

  return (
    <div className="flex min-h-screen bg-background dark:bg-gray-900 transition-colors">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-8" role="main" aria-label="主要内容区域">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>
    </div>
  )
}






