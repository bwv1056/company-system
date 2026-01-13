'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogOut, User } from 'lucide-react'

interface HeaderProps {
  user: {
    name: string
    email: string
    isManager: boolean
  }
}

export function Header({ user }: HeaderProps) {
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/v1/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">
          営業日報システム
        </h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="h-4 w-4" />
            <span>{user.name}</span>
            {user.isManager && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">
                管理者
              </span>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            ログアウト
          </Button>
        </div>
      </div>
    </header>
  )
}
