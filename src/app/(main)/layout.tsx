import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { Header } from '@/components/layouts/header'
import { Sidebar } from '@/components/layouts/sidebar'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={session} />
      <div className="flex">
        <Sidebar isManager={session.isManager} />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
