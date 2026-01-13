import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateDailyReportSchema } from '@/schemas/daily-report.schema'
import { successResponse, errorResponse, ErrorCodes } from '@/types/api'

// GET: Get daily report detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session) {
      return NextResponse.json(
        errorResponse(ErrorCodes.AUTH_REQUIRED, '認証が必要です'),
        { status: 401 }
      )
    }

    const { id } = await params

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

    if (!report) {
      return NextResponse.json(
        errorResponse(ErrorCodes.NOT_FOUND, '日報が見つかりません'),
        { status: 404 }
      )
    }

    // Non-managers can only view their own reports
    if (!session.isManager && Number(report.salesPersonId) !== session.id) {
      return NextResponse.json(
        errorResponse(ErrorCodes.PERMISSION_DENIED, '権限がありません'),
        { status: 403 }
      )
    }

    return NextResponse.json(
      successResponse({
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
          visitTime: vr.visitTime?.toISOString().slice(11, 16) || null,
          visitContent: vr.visitContent,
        })),
        comments: report.managerComments.map((comment) => ({
          id: Number(comment.id),
          manager: {
            id: Number(comment.manager.id),
            name: comment.manager.name,
          },
          coment: comment.coment,
          createdAt: comment.createdAt.toISOString(),
        })),
        isOwner: Number(report.salesPersonId) === session.id,
        createdAt: report.createdAt.toISOString(),
        updatedAt: report.updatedAt.toISOString(),
      })
    )
  } catch (error) {
    console.error('Get daily report error:', error)
    return NextResponse.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, 'サーバーエラーが発生しました'),
      { status: 500 }
    )
  }
}

// PUT: Update daily report
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session) {
      return NextResponse.json(
        errorResponse(ErrorCodes.AUTH_REQUIRED, '認証が必要です'),
        { status: 401 }
      )
    }

    const { id } = await params

    const report = await prisma.dailyReport.findUnique({
      where: { id: BigInt(id) },
    })

    if (!report) {
      return NextResponse.json(
        errorResponse(ErrorCodes.NOT_FOUND, '日報が見つかりません'),
        { status: 404 }
      )
    }

    // Only owner can update
    if (Number(report.salesPersonId) !== session.id) {
      return NextResponse.json(
        errorResponse(ErrorCodes.PERMISSION_DENIED, '権限がありません'),
        { status: 403 }
      )
    }

    const body = await request.json()
    const result = updateDailyReportSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        errorResponse(ErrorCodes.VALIDATION_ERROR, result.error.errors[0].message),
        { status: 400 }
      )
    }

    const { reportDate, problem, plan, visitRecords } = result.data

    // Delete existing visit records and create new ones
    await prisma.visitRecord.deleteMany({
      where: { reportId: BigInt(id) },
    })

    const updatedReport = await prisma.dailyReport.update({
      where: { id: BigInt(id) },
      data: {
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
        id: Number(updatedReport.id),
        reportDate: updatedReport.reportDate.toISOString().split('T')[0],
        salesPersonId: Number(updatedReport.salesPersonId),
        problem: updatedReport.problem,
        plan: updatedReport.plan,
        visitRecords: updatedReport.visitRecords.map((vr) => ({
          id: Number(vr.id),
          customerId: Number(vr.customerId),
          customerName: vr.customer.companyName,
          visitTime: vr.visitTime?.toISOString().slice(11, 16) || null,
          visitContent: vr.visitContent,
        })),
        createdAt: updatedReport.createdAt.toISOString(),
        updatedAt: updatedReport.updatedAt.toISOString(),
      })
    )
  } catch (error) {
    console.error('Update daily report error:', error)
    return NextResponse.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, 'サーバーエラーが発生しました'),
      { status: 500 }
    )
  }
}

// DELETE: Delete daily report
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session) {
      return NextResponse.json(
        errorResponse(ErrorCodes.AUTH_REQUIRED, '認証が必要です'),
        { status: 401 }
      )
    }

    const { id } = await params

    const report = await prisma.dailyReport.findUnique({
      where: { id: BigInt(id) },
    })

    if (!report) {
      return NextResponse.json(
        errorResponse(ErrorCodes.NOT_FOUND, '日報が見つかりません'),
        { status: 404 }
      )
    }

    // Only owner can delete
    if (Number(report.salesPersonId) !== session.id) {
      return NextResponse.json(
        errorResponse(ErrorCodes.PERMISSION_DENIED, '権限がありません'),
        { status: 403 }
      )
    }

    await prisma.dailyReport.delete({
      where: { id: BigInt(id) },
    })

    return NextResponse.json(
      successResponse({ message: '日報を削除しました' })
    )
  } catch (error) {
    console.error('Delete daily report error:', error)
    return NextResponse.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, 'サーバーエラーが発生しました'),
      { status: 500 }
    )
  }
}
