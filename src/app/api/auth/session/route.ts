import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '../../../../lib/prisma';
import { verifyJWT } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(process.env.COOKIE_NAME || 'auth-token');

    if (!token) {
      return NextResponse.json({ user: null });
    }

    const decoded = await verifyJWT(token.value);
    if (!decoded) {
      return NextResponse.json({ user: null });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded },
      select: {
        id: true,
        email: true,
        name: true,
        weightUnit: true,
        barbellWeight: true,
        createdAt: true
      }
    });

    if (!user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({ user: null });
  }
} 