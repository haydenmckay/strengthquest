import { NextResponse } from 'next/server';
import { createSession, verifyJWT } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';

// Helper function to handle verification logic
async function verifyAndCreateSession(token: string | null, request: Request) {
  try {
    console.log('Verifying magic link token...');

    if (!token) {
      console.error('No token provided');
      return { error: 'invalid_token' };
    }

    // Verify token
    const userId = await verifyJWT(token);
    if (!userId) {
      console.error('Invalid or expired token');
      return { error: 'invalid_token' };
    }
    console.log('✓ Token verified for user:', userId);

    // Create session
    try {
      const sessionToken = await createSession(userId);
      console.log('✓ Session created');
      return { success: true, token: sessionToken };
    } catch (error) {
      console.error('Failed to create session:', error);
      return { error: 'session_error' };
    }
  } catch (error) {
    console.error('Verification error:', error);
    return { error: 'server_error' };
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  
  const result = await verifyAndCreateSession(token, request);
  
  if (result.error) {
    return NextResponse.redirect(new URL(`/login?error=${result.error}`, request.url));
  }
  
  return NextResponse.redirect(new URL('/', request.url));
}

export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    const result = await verifyAndCreateSession(token, request);
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('POST verification error:', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
} 