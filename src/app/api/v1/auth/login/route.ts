import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { createToken, setTokenCookie } from '@/lib/auth'
import { loginSchema } from '@/schemas/auth.schema'
import { successResponse, errorResponse, ErrorCodes } from '@/types/api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const result = loginSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        errorResponse(ErrorCodes.VALIDATION_ERROR, result.error.errors[0].message),
        { status: 400 }
      )
    }

    const { email, password } = result.data

    // Find user
    const user = await prisma.salesPerson.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        errorResponse(ErrorCodes.AUTH_INVALID, 'メールアドレスまたはパスワードが正しくありません'),
        { status: 401 }
      )
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return NextResponse.json(
        errorResponse(ErrorCodes.AUTH_INVALID, 'メールアドレスまたはパスワードが正しくありません'),
        { status: 401 }
      )
    }

    // Create token
    const token = await createToken({
      id: Number(user.id),
      email: user.email,
      name: user.name,
      isManager: user.isManager,
    })

    const response = NextResponse.json(
      successResponse({
        token,
        user: {
          id: Number(user.id),
          name: user.name,
          email: user.email,
          department: user.department,
          isManager: user.isManager,
        },
      })
    )

    // Set cookie
    response.headers.set('Set-Cookie', `token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${60 * 60 * 24}`)

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, 'サーバーエラーが発生しました'),
      { status: 500 }
    )
  }
}
