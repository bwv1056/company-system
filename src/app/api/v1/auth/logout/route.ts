import { NextResponse } from 'next/server'
import { successResponse } from '@/types/api'

export async function POST() {
  const response = NextResponse.json(
    successResponse({ message: 'ログアウトしました' })
  )

  response.headers.set('Set-Cookie', 'token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0')

  return response
}
