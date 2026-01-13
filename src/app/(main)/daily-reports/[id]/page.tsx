import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowLeft, Edit, MessageSquare } from 'lucide-react'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CommentForm } from './_components/comment-form'

interface PageProps {
  params: Promise<{ id: string }>
}

async function getDailyReport(id: number, userId: number) {
  const report = await prisma.dailyReport.findUnique({
    where: { id: BigInt(id) },
    include: {
      salesPerson: {
        select: { id: true, name: true, department: true },
      },
      visitRecords: {
        include: {
          customer: {
            select: { id: true, companyName: true },
          },
        },
        orderBy: { visitTime: 'asc' },
      },
      managerComments: {
        include: {
          manager: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!report) return null

  return {
    id: Number(report.id),
    reportDate: report.reportDate.toISOString().split('T')[0],
    salesPerson: {
      id: Number(report.salesPerson.id),
      name: report.salesPerson.name,
      department: report.salesPerson.department,
    },
    problem: report.problem,
    plan: report.plan,
    visitRecords: report.visitRecords.map((vr) => ({
      id: Number(vr.id),
      customer: {
        id: Number(vr.customer.id),
        companyName: vr.customer.companyName,
      },
      visitTime: vr.visitTime ? vr.visitTime.toISOString().substring(11, 16) : null,
      visitContent: vr.visitContent,
    })),
    comments: report.managerComments.map((c) => ({
      id: Number(c.id),
      manager: {
        id: Number(c.manager.id),
        name: c.manager.name,
      },
      coment: c.coment,
      createdAt: c.createdAt.toISOString(),
    })),
    isOwner: Number(report.salesPersonId) === userId,
  }
}

export default async function DailyReportDetailPage({ params }: PageProps) {
  const session = await getSession()
  if (!session) {
    redirect('/login')
  }

  const resolvedParams = await params
  const reportId = parseInt(resolvedParams.id)
  if (isNaN(reportId)) {
    notFound()
  }

  const report = await getDailyReport(reportId, session.id)
  if (!report) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">日報詳細</h1>
        <div className="flex gap-2">
          {report.isOwner && (
            <Link href={`/daily-reports/${report.id}/edit`}>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                編集
              </Button>
            </Link>
          )}
          <Link href="/daily-reports">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              一覧に戻る
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">基本情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><span className="font-medium">報告日:</span> {report.reportDate}</p>
          <p><span className="font-medium">営業担当:</span> {report.salesPerson.name} {report.salesPerson.department && `(${report.salesPerson.department})`}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">訪問記録</CardTitle>
        </CardHeader>
        <CardContent>
          {report.visitRecords.length === 0 ? (
            <p className="text-gray-500">訪問記録がありません</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>顧客名</TableHead>
                  <TableHead>訪問時刻</TableHead>
                  <TableHead>訪問内容</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.visitRecords.map((vr) => (
                  <TableRow key={vr.id}>
                    <TableCell>{vr.customer.companyName}</TableCell>
                    <TableCell>{vr.visitTime || '-'}</TableCell>
                    <TableCell className="whitespace-pre-wrap">{vr.visitContent}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">課題・相談（Problem）</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap">{report.problem || '記載なし'}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">明日やること（Plan）</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap">{report.plan || '記載なし'}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            上長コメント
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {report.comments.length === 0 ? (
            <p className="text-gray-500">コメントがありません</p>
          ) : (
            <div className="space-y-4">
              {report.comments.map((comment) => (
                <div key={comment.id} className="p-4 bg-gray-50 rounded-md">
                  <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                    <span className="font-medium">{comment.manager.name}</span>
                    <span>{new Date(comment.createdAt).toLocaleString('ja-JP')}</span>
                  </div>
                  <p className="whitespace-pre-wrap">{comment.coment}</p>
                </div>
              ))}
            </div>
          )}

          {session.isManager && (
            <CommentForm reportId={report.id} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
