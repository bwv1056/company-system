import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, MessageSquare, CheckCircle, XCircle } from 'lucide-react'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function getDashboardData(userId: number) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().split('T')[0]

  // 本日の日報を確認
  const todayReport = await prisma.dailyReport.findFirst({
    where: {
      salesPersonId: BigInt(userId),
      reportDate: today,
    },
    select: { id: true },
  })

  // 未読コメント数（簡易的に最近のコメント数を取得）
  const unreadCommentsCount = await prisma.managerComment.count({
    where: {
      dailyReport: {
        salesPersonId: BigInt(userId),
      },
      createdAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 過去7日
      },
    },
  })

  // 最近の日報
  const recentReports = await prisma.dailyReport.findMany({
    where: {
      salesPersonId: BigInt(userId),
    },
    orderBy: { reportDate: 'desc' },
    take: 5,
    select: {
      id: true,
      reportDate: true,
      _count: {
        select: {
          visitRecords: true,
          managerComments: true,
        },
      },
    },
  })

  return {
    today: todayStr,
    todayReportStatus: {
      hasReport: !!todayReport,
      reportId: todayReport ? Number(todayReport.id) : null,
    },
    unreadCommentsCount,
    recentReports: recentReports.map((r) => ({
      id: Number(r.id),
      reportDate: r.reportDate.toISOString().split('T')[0],
      visitCount: r._count.visitRecords,
      commentCount: r._count.managerComments,
    })),
  }
}

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) {
    redirect('/login')
  }

  const data = await getDashboardData(session.id)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">ダッシュボード</h1>

      <p className="text-gray-600">本日: {data.today}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Today's Report Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">本日の日報状況</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mb-4">
              {data.todayReportStatus.hasReport ? (
                <>
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  <span className="text-green-600 font-medium">作成済み</span>
                </>
              ) : (
                <>
                  <XCircle className="h-6 w-6 text-red-500" />
                  <span className="text-red-600 font-medium">未作成</span>
                </>
              )}
            </div>
            {data.todayReportStatus.hasReport ? (
              <Link href={`/daily-reports/${data.todayReportStatus.reportId}`}>
                <Button variant="outline" className="w-full">
                  日報を確認する
                </Button>
              </Link>
            ) : (
              <Link href="/daily-reports/new">
                <Button className="w-full">日報を作成する</Button>
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Unread Comments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">未読コメント</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mb-4">
              <MessageSquare className="h-6 w-6 text-blue-500" />
              <span className="text-2xl font-bold">{data.unreadCommentsCount}件</span>
            </div>
            <Link href="/daily-reports">
              <Button variant="outline" className="w-full">
                確認する
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">最近の日報</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentReports.length === 0 ? (
            <p className="text-gray-500 text-center py-4">日報がありません</p>
          ) : (
            <div className="space-y-2">
              {data.recentReports.map((report) => (
                <Link
                  key={report.id}
                  href={`/daily-reports/${report.id}`}
                  className="flex items-center justify-between p-3 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <span className="font-medium">{report.reportDate}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>訪問 {report.visitCount}件</span>
                    <span>コメント {report.commentCount}件</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
