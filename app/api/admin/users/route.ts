import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      where : {role : 'USER'}
    })

    return NextResponse.json(users)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error users' },
      { status: 500 }
    )
  }
}