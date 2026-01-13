'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, FileText, Building2, Users } from 'lucide-react'

interface SidebarProps {
  isManager: boolean
}

export function Sidebar({ isManager }: SidebarProps) {
  const pathname = usePathname()

  const navigation = [
    {
      name: 'ダッシュボード',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: '日報一覧',
      href: '/daily-reports',
      icon: FileText,
    },
    {
      name: '顧客管理',
      href: '/customers',
      icon: Building2,
    },
    ...(isManager
      ? [
          {
            name: '営業管理',
            href: '/sales-persons',
            icon: Users,
          },
        ]
      : []),
  ]

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-73px)]">
      <nav className="p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
