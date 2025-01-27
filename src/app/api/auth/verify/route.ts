import { NextResponse } from 'next/server';
import { createSession, verifyJWT } from '../../../../lib/auth';

export async function POST(request: Request) {
  try {
    // First try to parse the request body
    const body = await request.json().catch(() => null);
    if (!body || !body.token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      );
    }

    const { token } = body;

    // Verify the JWT token
    const userId = await verifyJWT(token);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Create a new session
    const sessionToken = await createSession(userId);
    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: 'Failed to create session' },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json({ 
      success: true,
      token: sessionToken
    }, { status: 200 });

  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 