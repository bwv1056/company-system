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

    const user = await prisma.salesPerson.findUnique({
      where: { id: BigInt(session.id) },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        isManager: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        errorResponse(ErrorCodes.NOT_FOUND, 'ユーザーが見つかりません'),
        { status: 404 }
      )
    }

    return NextResponse.json(
      successResponse({
        id: Number(user.id),
        name: user.name,
        email: user.email,
        department: user.department,
        isManager: user.isManager,
      })
    )
  } catch (error) {
    console.error('Get me error:', error)
    return NextResponse.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, 'サーバーエラーが発生しました'),
      { status: 500 }
    )
  }
}
