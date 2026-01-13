import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getSessionFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateSalesPersonSchema } from '@/schemas/sales-person.schema'
import { successResponse, errorResponse, ErrorCodes } from '@/types/api'

// GET: Get sales person
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session || !session.isManager) {
      return NextResponse.json(
        errorResponse(ErrorCodes.PERMISSION_DENIED, '権限がありません'),
        { status: 403 }
      )
    }

    const { id } = await params

    const salesPerson = await prisma.salesPerson.findUnique({
      where: { id: BigInt(id) },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        isManager: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!salesPerson) {
      return NextResponse.json(
        errorResponse(ErrorCodes.NOT_FOUND, '営業担当者が見つかりません'),
        { status: 404 }
      )
    }

    return NextResponse.json(
      successResponse({
        id: Number(salesPerson.id),
        name: salesPerson.name,
        email: salesPerson.email,
        department: salesPerson.department,
        isManager: salesPerson.isManager,
        createdAt: salesPerson.createdAt.toISOString(),
        updatedAt: salesPerson.updatedAt.toISOString(),
      })
    )
  } catch (error) {
    console.error('Get sales person error:', error)
    return NextResponse.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, 'サーバーエラーが発生しました'),
      { status: 500 }
    )
  }
}

// PUT: Update sales person
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session || !session.isManager) {
      return NextResponse.json(
        errorResponse(ErrorCodes.PERMISSION_DENIED, '権限がありません'),
        { status: 403 }
      )
    }

    const { id } = await params

    const salesPerson = await prisma.salesPerson.findUnique({
      where: { id: BigInt(id) },
    })

    if (!salesPerson) {
      return NextResponse.json(
        errorResponse(ErrorCodes.NOT_FOUND, '営業担当者が見つかりません'),
        { status: 404 }
      )
    }

    const body = await request.json()
    const result = updateSalesPersonSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        errorResponse(ErrorCodes.VALIDATION_ERROR, result.error.errors[0].message),
        { status: 400 }
      )
    }

    // Check for duplicate email
    if (result.data.email !== salesPerson.email) {
      const existing = await prisma.salesPerson.findUnique({
        where: { email: result.data.email },
      })
      if (existing) {
        return NextResponse.json(
          errorResponse(ErrorCodes.DUPLICATE_ERROR, 'このメールアドレスは既に登録されています'),
          { status: 400 }
        )
      }
    }

    const updateData: any = {
      name: result.data.name,
      email: result.data.email,
      department: result.data.department || null,
      isManager: result.data.isManager ?? salesPerson.isManager,
    }

    if (result.data.password) {
      updateData.password = await bcrypt.hash(result.data.password, 10)
    }

    const updatedSalesPerson = await prisma.salesPerson.update({
      where: { id: BigInt(id) },
      data: updateData,
    })

    return NextResponse.json(
      successResponse({
        id: Number(updatedSalesPerson.id),
        name: updatedSalesPerson.name,
        email: updatedSalesPerson.email,
        department: updatedSalesPerson.department,
        isManager: updatedSalesPerson.isManager,
        createdAt: updatedSalesPerson.createdAt.toISOString(),
        updatedAt: updatedSalesPerson.updatedAt.toISOString(),
      })
    )
  } catch (error) {
    console.error('Update sales person error:', error)
    return NextResponse.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, 'サーバーエラーが発生しました'),
      { status: 500 }
    )
  }
}

// DELETE: Delete sales person
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session || !session.isManager) {
      return NextResponse.json(
        errorResponse(ErrorCodes.PERMISSION_DENIED, '権限がありません'),
        { status: 403 }
      )
    }

    const { id } = await params

    // Cannot delete yourself
    if (Number(id) === session.id) {
      return NextResponse.json(
        errorResponse(ErrorCodes.SELF_DELETE_ERROR, '自分自身を削除することはできません'),
        { status: 400 }
      )
    }

    // Check for references
    const reportCount = await prisma.dailyReport.count({
      where: { salesPersonId: BigInt(id) },
    })

    if (reportCount > 0) {
      return NextResponse.json(
        errorResponse(ErrorCodes.REFERENCE_ERROR, 'この営業担当者は日報で使用されているため削除できません'),
        { status: 400 }
      )
    }

    await prisma.salesPerson.delete({
      where: { id: BigInt(id) },
    })

    return NextResponse.json(
      successResponse({ message: '営業担当者を削除しました' })
    )
  } catch (error) {
    console.error('Delete sales person error:', error)
    return NextResponse.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, 'サーバーエラーが発生しました'),
      { status: 500 }
    )
  }
}
