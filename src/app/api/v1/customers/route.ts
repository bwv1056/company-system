import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createCustomerSchema } from '@/schemas/customer.schema'
import { successResponse, errorResponse, ErrorCodes } from '@/types/api'

// GET: List customers
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
    const companyName = searchParams.get('company_name')
    const page = parseInt(searchParams.get('page') || '1')
    const perPage = parseInt(searchParams.get('per_page') || '20')

    const where: any = {}
    if (companyName) {
      where.companyName = { contains: companyName }
    }

    const [customers, totalCount] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { companyName: 'asc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.customer.count({ where }),
    ])

    return NextResponse.json(
      successResponse({
        items: customers.map((customer) => ({
          id: Number(customer.id),
          companyName: customer.companyName,
          companyPerson: customer.companyPerson,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
          createdAt: customer.createdAt.toISOString(),
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
    console.error('List customers error:', error)
    return NextResponse.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, 'サーバーエラーが発生しました'),
      { status: 500 }
    )
  }
}

// POST: Create customer
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
    const result = createCustomerSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        errorResponse(ErrorCodes.VALIDATION_ERROR, result.error.errors[0].message),
        { status: 400 }
      )
    }

    const customer = await prisma.customer.create({
      data: {
        companyName: result.data.companyName,
        companyPerson: result.data.companyPerson || null,
        email: result.data.email || null,
        address: result.data.address || null,
        phone: result.data.phone || null,
      },
    })

    return NextResponse.json(
      successResponse({
        id: Number(customer.id),
        companyName: customer.companyName,
        companyPerson: customer.companyPerson,
        email: customer.email,
        address: customer.address,
        phone: customer.phone,
        createdAt: customer.createdAt.toISOString(),
        updatedAt: customer.updatedAt.toISOString(),
      }),
      { status: 201 }
    )
  } catch (error) {
    console.error('Create customer error:', error)
    return NextResponse.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, 'サーバーエラーが発生しました'),
      { status: 500 }
    )
  }
}
