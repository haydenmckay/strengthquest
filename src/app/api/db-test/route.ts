import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { createClient } from '@libsql/client';

export async function GET() {
  console.log('Testing database connections...');
  const results = {
    prismaTest: null as any,
    tursoTest: null as any,
    envVars: {
      DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
      DATABASE_AUTH_TOKEN: process.env.DATABASE_AUTH_TOKEN ? 'Set' : 'Not set',
      NODE_ENV: process.env.NODE_ENV
    }
  };

  // Test Prisma connection
  try {
    const count = await prisma.user.count();
    results.prismaTest = { success: true, count };
    console.log('✓ Prisma connection successful');
  } catch (error) {
    results.prismaTest = { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
    console.error('✗ Prisma connection failed:', error);
  }

  // Test direct Turso connection
  try {
    const turso = createClient({
      url: process.env.DATABASE_URL ?? '',
      authToken: process.env.DATABASE_AUTH_TOKEN
    });
    
    const result = await turso.execute('SELECT 1');
    results.tursoTest = { success: true, result };
    console.log('✓ Turso connection successful');
  } catch (error) {
    results.tursoTest = { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
    console.error('✗ Turso connection failed:', error);
  }

  return NextResponse.json(results);
} 