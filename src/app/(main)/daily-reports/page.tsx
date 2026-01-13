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
  searchParams: Promise<{ date_from?: string; date_to?: string }>
}

async function getDailyReports(userId: number, isManager: boolean, dateFrom?: string, dateTo?: string) {
  const where: {
    salesPersonId?: bigint
    reportDate?: { gte?: string; lte?: string }
  } = {}

  // 管理者は全ての日報を見られる、一般は自分の日報のみ
  if (!isManager) {
    where.salesPersonId = BigInt(userId)
  }

  if (dateFrom || dateTo) {
    where.reportDate = {}
    if (dateFrom) where.reportDate.gte = dateFrom
    if (dateTo) where.reportDate.lte = dateTo
  }

  const reports = await prisma.dailyReport.findMany({
    where,
    orderBy: { reportDate: 'desc' },
    take: 100,
    include: {
      salesPerson: {
        select: { id: true, name: true },
      },
      _count: {
        select: {
          visitRecords: true,
          managerComments: true,
        },
      },
    },
  })

  return reports.map((r) => ({
    id: Number(r.id),
    reportDate: r.reportDate.toISOString().split('T')[0],
    salesPerson: {
      id: Number(r.salesPerson.id),
      name: r.salesPerson.name,
    },
    visitCount: r._count.visitRecords,
    commentCount: r._count.managerComments,
  }))
}

export default async function DailyReportsPage({ searchParams }: PageProps) {
  const session = await getSession()
  if (!session) {
    redirect('/login')
  }

  const resolvedParams = await searchParams
  const reports = await getDailyReports(
    session.id,
    session.isManager,
    resolvedParams.date_from,
    resolvedParams.date_to
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">日報一覧</h1>
        <Link href="/daily-reports/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            新規作成
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">検索条件</CardTitle>
        </CardHeader>
        <CardContent>
          <SearchForm
            basePath="/daily-reports"
            fields={[
              { name: 'date_from', label: '報告日（開始）', type: 'date' },
              { name: 'date_to', label: '報告日（終了）', type: 'date' },
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {reports.length === 0 ? (
            <p className="text-center text-gray-500 py-8">該当する日報がありません</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>報告日</TableHead>
                  <TableHead>営業担当</TableHead>
                  <TableHead className="text-center">訪問件数</TableHead>
                  <TableHead className="text-center">コメント</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>{report.reportDate}</TableCell>
                    <TableCell>{report.salesPerson.name}</TableCell>
                    <TableCell className="text-center">{report.visitCount}件</TableCell>
                    <TableCell className="text-center">{report.commentCount}件</TableCell>
                    <TableCell>
                      <Link href={`/daily-reports/${report.id}`}>
                        <Button variant="outline" size="sm">詳細</Button>
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
