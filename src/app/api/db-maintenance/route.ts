import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function GET() {
  const prisma = new PrismaClient();
  
  try {
    // Test database connection by running a simple query
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({
      success: true,
      connection: 'PostgreSQL connection successful',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database maintenance check failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 