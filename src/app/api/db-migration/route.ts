import { NextResponse } from 'next/server'
import { migrateToTurso } from '../../../lib/migration'
import { initializeSchema } from '../../../lib/schema'
import { headers } from 'next/headers'

export async function POST() {
  try {
    // Basic security check - only allow in development or with admin token
    const headersList = headers()
    const authToken = headersList.get('x-admin-token')
    
    if (process.env.NODE_ENV === 'production' && authToken !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Initialize schema first
    console.log('Step 1: Initializing schema...')
    const schemaResult = await initializeSchema()
    if (!schemaResult.success) {
      return NextResponse.json({
        error: 'Schema initialization failed',
        details: schemaResult.error
      }, { status: 500 })
    }
    console.log('✓ Schema initialized')

    // Then migrate data
    console.log('\nStep 2: Migrating data...')
    const migrationResult = await migrateToTurso()
    
    if (migrationResult.success) {
      return NextResponse.json({
        message: 'Migration completed successfully',
        stats: migrationResult.stats
      })
    } else {
      return NextResponse.json({
        error: 'Migration failed',
        details: migrationResult.error
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Migration endpoint error:', error)
    return NextResponse.json({
      error: 'Migration endpoint error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 