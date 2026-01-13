import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus } from 'lucide-react'
import { SearchForm } from '@/components/search-form'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface PageProps {
  searchParams: Promise<{ name?: string }>
}

async function getSalesPersons(name?: string) {
  const where: { name?: { contains: string; mode: 'insensitive' } } = {}

  if (name) {
    where.name = { contains: name, mode: 'insensitive' }
  }

  const salesPersons = await prisma.salesPerson.findMany({
    where,
    orderBy: { name: 'asc' },
    take: 100,
    select: {
      id: true,
      name: true,
      email: true,
      department: true,
      isManager: true,
    },
  })

  return salesPersons.map((sp) => ({
    id: Number(sp.id),
    name: sp.name,
    email: sp.email,
    department: sp.department,
    isManager: sp.isManager,
  }))
}

export default async function SalesPersonsPage({ searchParams }: PageProps) {
  const session = await getSession()
  if (!session) {
    redirect('/login')
  }

  // 管理者のみアクセス可能
  if (!session.isManager) {
    redirect('/dashboard')
  }

  const resolvedParams = await searchParams
  const salesPersons = await getSalesPersons(resolvedParams.name)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">営業一覧</h1>
        <Link href="/sales-persons/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            新規登録
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">検索条件</CardTitle>
        </CardHeader>
        <CardContent>
          <SearchForm
            basePath="/sales-persons"
            fields={[
              { name: 'name', label: '氏名', placeholder: '氏名を入力' },
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {salesPersons.length === 0 ? (
            <p className="text-center text-gray-500 py-8">該当する営業担当者がいません</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>氏名</TableHead>
                  <TableHead>メールアドレス</TableHead>
                  <TableHead>部署</TableHead>
                  <TableHead>権限</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesPersons.map((sp) => (
                  <TableRow key={sp.id}>
                    <TableCell>{sp.name}</TableCell>
                    <TableCell>{sp.email}</TableCell>
                    <TableCell>{sp.department || '-'}</TableCell>
                    <TableCell>
                      {sp.isManager ? (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">管理者</span>
                      ) : (
                        <span className="text-gray-500">一般</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Link href={`/sales-persons/${sp.id}/edit`}>
                        <Button variant="outline" size="sm">編集</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
