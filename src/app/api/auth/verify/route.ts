import { NextResponse } from 'next/server';
import { createSession, verifyJWT } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    console.log('Verifying magic link token...');
    
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      console.error('No token provided');
      return NextResponse.redirect(new URL('/login?error=invalid_token', request.url));
    }

    // Verify token
    const userId = await verifyJWT(token);
    if (!userId) {
      console.error('Invalid or expired token');
      return NextResponse.redirect(new URL('/login?error=invalid_token', request.url));
    }
    console.log('✓ Token verified for user:', userId);

    // Create session
    try {
      await createSession(userId);
      console.log('✓ Session created');
    } catch (error) {
      console.error('Failed to create session:', error);
      return NextResponse.redirect('/login?error=session_error');
    }

    // Redirect to home
    console.log('✓ Authentication successful');
    return NextResponse.redirect(new URL('/', request.url));
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.redirect('/login?error=server_error');
  }
} 