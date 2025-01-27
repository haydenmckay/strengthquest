import { NextResponse } from 'next/server';
import fs from 'fs';
import { initDatabase } from '../../../lib/db-init';

export async function GET() {
  try {
    const dbPath = initDatabase();
    
    // Check if database file exists and is writable
    const exists = fs.existsSync(dbPath);
    let isWritable = false;
    
    try {
      fs.accessSync(dbPath, fs.constants.W_OK);
      isWritable = true;
    } catch (e) {
      isWritable = false;
    }

    return NextResponse.json({
      success: true,
      dbPath,
      exists,
      isWritable,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database maintenance check failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 