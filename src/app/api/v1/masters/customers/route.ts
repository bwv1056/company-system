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

    const customers = await prisma.customer.findMany({
      select: {
        id: true,
        companyName: true,
      },
      orderBy: { companyName: 'asc' },
    })

    return NextResponse.json(
      successResponse({
        items: customers.map((c) => ({
          id: Number(c.id),
          companyName: c.companyName,
        })),
      })
    )
  } catch (error) {
    console.error('Get customers master error:', error)
    return NextResponse.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, 'サーバーエラーが発生しました'),
      { status: 500 }
    )
  }
}
