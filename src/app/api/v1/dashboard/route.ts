import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, ErrorCodes } from '@/types/api'

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session) {
      return NextResponse.json(
        errorResponse(ErrorCodes.AUTH_REQUIRED, '認証が必要です'),
        { status: 401 }
      )
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Check today's report
    const todayReport = await prisma.dailyReport.findFirst({
      where: {
        salesPersonId: BigInt(session.id),
        reportDate: today,
      },
    })

    // Get recent reports
    const recentReports = await prisma.dailyReport.findMany({
      where: {
        salesPersonId: BigInt(session.id),
      },
      include: {
        _count: {
          select: {
            visitRecords: true,
            managerComments: true,
          },
        },
      },
      orderBy: { reportDate: 'desc' },
      take: 5,
    })

    // Count unread comments (simplified: comments in last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const unreadCommentsCount = await prisma.managerComment.count({
      where: {
        dailyReport: {
          salesPersonId: BigInt(session.id),
        },
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
    })

    return NextResponse.json(
      successResponse({
        today: today.toISOString().split('T')[0],
        todayReportStatus: {
          hasReport: !!todayReport,
          reportId: todayReport ? Number(todayReport.id) : null,
        },
        unreadCommentsCount,
        recentReports: recentReports.map((report) => ({
          id: Number(report.id),
          reportDate: report.reportDate.toISOString().split('T')[0],
          visitCount: report._count.visitRecords,
          commentCount: report._count.managerComments,
        })),
      })
    )
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, 'サーバーエラーが発生しました'),
      { status: 500 }
    )
  }
}
