import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getSessionFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createSalesPersonSchema } from '@/schemas/sales-person.schema'
import { successResponse, errorResponse, ErrorCodes } from '@/types/api'

// GET: List sales persons
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session || !session.isManager) {
      return NextResponse.json(
        errorResponse(ErrorCodes.PERMISSION_DENIED, '権限がありません'),
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const name = searchParams.get('name')
    const department = searchParams.get('department')
    const page = parseInt(searchParams.get('page') || '1')
    const perPage = parseInt(searchParams.get('per_page') || '20')

    const where: any = {}
    if (name) {
      where.name = { contains: name }
    }
    if (department) {
      where.department = { contains: department }
    }

    const [salesPersons, totalCount] = await Promise.all([
      prisma.salesPerson.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
          isManager: true,
          createdAt: true,
        },
        orderBy: { name: 'asc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.salesPerson.count({ where }),
    ])

    return NextResponse.json(
      successResponse({
        items: salesPersons.map((sp) => ({
          id: Number(sp.id),
          name: sp.name,
          email: sp.email,
          department: sp.department,
          isManager: sp.isManager,
          createdAt: sp.createdAt.toISOString(),
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
    console.error('List sales persons error:', error)
    return NextResponse.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, 'サーバーエラーが発生しました'),
      { status: 500 }
    )
  }
}

// POST: Create sales person
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session || !session.isManager) {
      return NextResponse.json(
        errorResponse(ErrorCodes.PERMISSION_DENIED, '権限がありません'),
        { status: 403 }
      )
    }

    const body = await request.json()
    const result = createSalesPersonSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        errorResponse(ErrorCodes.VALIDATION_ERROR, result.error.errors[0].message),
        { status: 400 }
      )
    }

    // Check for duplicate email
    const existing = await prisma.salesPerson.findUnique({
      where: { email: result.data.email },
    })

    if (existing) {
      return NextResponse.json(
        errorResponse(ErrorCodes.DUPLICATE_ERROR, 'このメールアドレスは既に登録されています'),
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(result.data.password, 10)

    const salesPerson = await prisma.salesPerson.create({
      data: {
        name: result.data.name,
        email: result.data.email,
        password: hashedPassword,
        department: result.data.department || null,
        isManager: result.data.isManager || false,
      },
    })

    return NextResponse.json(
      successResponse({
        id: Number(salesPerson.id),
        name: salesPerson.name,
        email: salesPerson.email,
        department: salesPerson.department,
        isManager: salesPerson.isManager,
        createdAt: salesPerson.createdAt.toISOString(),
        updatedAt: salesPerson.updatedAt.toISOString(),
      }),
      { status: 201 }
    )
  } catch (error) {
    console.error('Create sales person error:', error)
    return NextResponse.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, 'サーバーエラーが発生しました'),
      { status: 500 }
    )
  }
}
