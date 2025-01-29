import { NextResponse } from 'next/server';
import { createMagicLink } from '../../../../lib/auth';

// Rate limiting map
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 3; // 3 requests per minute

export async function POST(request: Request) {
  try {
    // Check environment variables with detailed logging
    console.log('Starting magic link request...');
    console.log('Environment variables check:');
    console.log('- RESEND_API_KEY:', process.env.RESEND_API_KEY ? `${process.env.RESEND_API_KEY.substring(0, 8)}...` : 'Not set');
    console.log('- NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL);
    console.log('- NODE_ENV:', process.env.NODE_ENV);

    if (!process.env.RESEND_API_KEY) {
      console.error('Resend API key is not configured');
      return NextResponse.json(
        { error: 'Email service is not configured' },
        { status: 500 }
      );
    }

    if (!process.env.NEXT_PUBLIC_APP_URL) {
      console.error('NEXT_PUBLIC_APP_URL is not configured');
      return NextResponse.json(
        { error: 'Application URL is not configured' },
        { status: 500 }
      );
    }

    const { email } = await request.json();
    console.log('Received email request for:', email);

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      console.error('Invalid email format:', email);
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    // Check rate limit
    const now = Date.now();
    const lastRequest = rateLimitMap.get(email) || 0;
    if (now - lastRequest < RATE_LIMIT_WINDOW) {
      console.log('Rate limit exceeded for:', email);
      return NextResponse.json(
        { error: 'Please wait a minute before requesting another magic link' },
        { status: 429 }
      );
    }

    // Update rate limit
    rateLimitMap.set(email, now);
    console.log('Rate limit updated for:', email);

    // Create and send magic link
    try {
      console.log('Attempting to create and send magic link...');
      await createMagicLink(email);
      console.log('Magic link sent successfully to:', email);
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Failed to create/send magic link:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to send magic link' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Magic link route error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
} 