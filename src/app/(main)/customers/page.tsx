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
  searchParams: Promise<{ company_name?: string }>
}

async function getCustomers(companyName?: string) {
  const where: { companyName?: { contains: string; mode: 'insensitive' } } = {}

  if (companyName) {
    where.companyName = { contains: companyName, mode: 'insensitive' }
  }

  const customers = await prisma.customer.findMany({
    where,
    orderBy: { companyName: 'asc' },
    take: 100,
    select: {
      id: true,
      companyName: true,
      companyPerson: true,
      email: true,
      phone: true,
    },
  })

  return customers.map((c) => ({
    id: Number(c.id),
    companyName: c.companyName,
    companyPerson: c.companyPerson,
    email: c.email,
    phone: c.phone,
  }))
}

export default async function CustomersPage({ searchParams }: PageProps) {
  const session = await getSession()
  if (!session) {
    redirect('/login')
  }

  const resolvedParams = await searchParams
  const customers = await getCustomers(resolvedParams.company_name)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">顧客一覧</h1>
        <Link href="/customers/new">
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
            basePath="/customers"
            fields={[
              { name: 'company_name', label: '会社名', placeholder: '会社名を入力' },
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {customers.length === 0 ? (
            <p className="text-center text-gray-500 py-8">該当する顧客がありません</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>会社名</TableHead>
                  <TableHead>担当者名</TableHead>
                  <TableHead>電話番号</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>{customer.companyName}</TableCell>
                    <TableCell>{customer.companyPerson || '-'}</TableCell>
                    <TableCell>{customer.phone || '-'}</TableCell>
                    <TableCell>
                      <Link href={`/customers/${customer.id}/edit`}>
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
