import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { createSession } from '@/lib/auth';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    try {
      console.log('Verifying token:', { tokenLength: token.length });
      
      // Verify the token
      const { payload } = await jwtVerify(token, JWT_SECRET);
      const userId = payload.userId as string;

      console.log('Token verified successfully:', { userId });

      // Create a new session
      await createSession(userId);

      console.log('Session created successfully');
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Token verification error:', error);
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 