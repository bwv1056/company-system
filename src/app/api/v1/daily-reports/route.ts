import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createDailyReportSchema } from '@/schemas/daily-report.schema'
import { successResponse, errorResponse, ErrorCodes } from '@/types/api'

// GET: List daily reports
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session) {
      return NextResponse.json(
        errorResponse(ErrorCodes.AUTH_REQUIRED, '認証が必要です'),
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    const salesPersonId = searchParams.get('sales_person_id')
    const page = parseInt(searchParams.get('page') || '1')
    const perPage = parseInt(searchParams.get('per_page') || '20')

    const where: any = {}

    // Non-managers can only see their own reports
    if (!session.isManager) {
      where.salesPersonId = BigInt(session.id)
    } else if (salesPersonId) {
      where.salesPersonId = BigInt(salesPersonId)
    }

    if (dateFrom) {
      where.reportDate = { ...where.reportDate, gte: new Date(dateFrom) }
    }
    if (dateTo) {
      where.reportDate = { ...where.reportDate, lte: new Date(dateTo) }
    }

    const [reports, totalCount] = await Promise.all([
      prisma.dailyReport.findMany({
        where,
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
        orderBy: { reportDate: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.dailyReport.count({ where }),
    ])

    return NextResponse.json(
      successResponse({
        items: reports.map((report) => ({
          id: Number(report.id),
          reportDate: report.reportDate.toISOString().split('T')[0],
          salesPerson: {
            id: Number(report.salesPerson.id),
            name: report.salesPerson.name,
          },
          visitCount: report._count.visitRecords,
          commentCount: report._count.managerComments,
          createdAt: report.createdAt.toISOString(),
        })),
        pagination: {
          currentPage: page,
          perPage,
          totalCount,
          totalPages: Math.ceil(totalCount / perPage),
        },
      })
    )
  } catch (error) {
    console.error('List daily reports error:', error)
    return NextResponse.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, 'サーバーエラーが発生しました'),
      { status: 500 }
    )
  }
}

// POST: Create daily report
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session) {
      return NextResponse.json(
        errorResponse(ErrorCodes.AUTH_REQUIRED, '認証が必要です'),
        { status: 401 }
      )
    }

    const body = await request.json()
    const result = createDailyReportSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        errorResponse(ErrorCodes.VALIDATION_ERROR, result.error.errors[0].message),
        { status: 400 }
      )
    }

    const { reportDate, problem, plan, visitRecords } = result.data

    // Check for duplicate
    const existing = await prisma.dailyReport.findFirst({
      where: {
        salesPersonId: BigInt(session.id),
        reportDate: new Date(reportDate),
      },
    })

    if (existing) {
      return NextResponse.json(
        errorResponse(ErrorCodes.DUPLICATE_ERROR, '指定された日付の日報は既に存在します'),
        { status: 400 }
      )
    }

    const report = await prisma.dailyReport.create({
      data: {
        salesPersonId: BigInt(session.id),
        reportDate: new Date(reportDate),
        problem: problem || null,
        plan: plan || null,
        visitRecords: visitRecords?.length
          ? {
              create: visitRecords.map((vr) => ({
                customerId: BigInt(vr.customerId),
                visitTime: vr.visitTime ? new Date(`1970-01-01T${vr.visitTime}:00`) : null,
                visitContent: vr.visitContent,
              })),
            }
          : undefined,
      },
      include: {
        visitRecords: {
          include: {
            customer: {
              select: { id: true, companyName: true },
            },
          },
        },
      },
    })

    return NextResponse.json(
      successResponse({
        id: Number(report.id),
        reportDate: report.reportDate.toISOString().split('T')[0],
        salesPersonId: Number(report.salesPersonId),
        problem: report.problem,
        plan: report.plan,
        visitRecords: report.visitRecords.map((vr) => ({
          id: Number(vr.id),
          customerId: Number(vr.customerId),
          customerName: vr.customer.companyName,
          visitTime: vr.visitTime?.toISOString().slice(11, 16) || null,
          visitContent: vr.visitContent,
        })),
        createdAt: report.createdAt.toISOString(),
        updatedAt: report.updatedAt.toISOString(),
      }),
      { status: 201 }
    )
  } catch (error) {
    console.error('Create daily report error:', error)
    return NextResponse.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, 'サーバーエラーが発生しました'),
      { status: 500 }
    )
  }
}
