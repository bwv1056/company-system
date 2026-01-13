import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateCustomerSchema } from '@/schemas/customer.schema'
import { successResponse, errorResponse, ErrorCodes } from '@/types/api'

// GET: Get customer
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

    const customer = await prisma.customer.findUnique({
      where: { id: BigInt(id) },
    })

    if (!customer) {
      return NextResponse.json(
        errorResponse(ErrorCodes.NOT_FOUND, '顧客が見つかりません'),
        { status: 404 }
      )
    }

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
      })
    )
  } catch (error) {
    console.error('Get customer error:', error)
    return NextResponse.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, 'サーバーエラーが発生しました'),
      { status: 500 }
    )
  }
}

// PUT: Update customer
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

    const customer = await prisma.customer.findUnique({
      where: { id: BigInt(id) },
    })

    if (!customer) {
      return NextResponse.json(
        errorResponse(ErrorCodes.NOT_FOUND, '顧客が見つかりません'),
        { status: 404 }
      )
    }

    const body = await request.json()
    const result = updateCustomerSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        errorResponse(ErrorCodes.VALIDATION_ERROR, result.error.errors[0].message),
        { status: 400 }
      )
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id: BigInt(id) },
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
        id: Number(updatedCustomer.id),
        companyName: updatedCustomer.companyName,
        companyPerson: updatedCustomer.companyPerson,
        email: updatedCustomer.email,
        address: updatedCustomer.address,
        phone: updatedCustomer.phone,
        createdAt: updatedCustomer.createdAt.toISOString(),
        updatedAt: updatedCustomer.updatedAt.toISOString(),
      })
    )
  } catch (error) {
    console.error('Update customer error:', error)
    return NextResponse.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, 'サーバーエラーが発生しました'),
      { status: 500 }
    )
  }
}

// DELETE: Delete customer
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

    if (!session.isManager) {
      return NextResponse.json(
        errorResponse(ErrorCodes.PERMISSION_DENIED, '権限がありません'),
        { status: 403 }
      )
    }

    const { id } = await params

    // Check for references
    const visitRecordCount = await prisma.visitRecord.count({
      where: { customerId: BigInt(id) },
    })

    if (visitRecordCount > 0) {
      return NextResponse.json(
        errorResponse(ErrorCodes.REFERENCE_ERROR, 'この顧客は訪問記録で使用されているため削除できません'),
        { status: 400 }
      )
    }

    await prisma.customer.delete({
      where: { id: BigInt(id) },
    })

    return NextResponse.json(
      successResponse({ message: '顧客を削除しました' })
    )
  } catch (error) {
    console.error('Delete customer error:', error)
    return NextResponse.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, 'サーバーエラーが発生しました'),
      { status: 500 }
    )
  }
}
