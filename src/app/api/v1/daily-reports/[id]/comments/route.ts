import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createCommentSchema } from '@/schemas/daily-report.schema'
import { successResponse, errorResponse, ErrorCodes } from '@/types/api'

// POST: Create comment
export async function POST(
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

    // Only managers can comment
    if (!session.isManager) {
      return NextResponse.json(
        errorResponse(ErrorCodes.PERMISSION_DENIED, '権限がありません'),
        { status: 403 }
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

    const body = await request.json()
    const result = createCommentSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        errorResponse(ErrorCodes.VALIDATION_ERROR, result.error.errors[0].message),
        { status: 400 }
      )
    }

    const comment = await prisma.managerComment.create({
      data: {
        reportId: BigInt(id),
        managerId: BigInt(session.id),
        coment: result.data.coment,
      },
      include: {
        manager: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json(
      successResponse({
        id: Number(comment.id),
        reportId: Number(comment.reportId),
        manager: {
          id: Number(comment.manager.id),
          name: comment.manager.name,
        },
        coment: comment.coment,
        createdAt: comment.createdAt.toISOString(),
      }),
      { status: 201 }
    )
  } catch (error) {
    console.error('Create comment error:', error)
    return NextResponse.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, 'サーバーエラーが発生しました'),
      { status: 500 }
    )
  }
}
