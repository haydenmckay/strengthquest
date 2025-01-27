import { PrismaClient } from '@prisma/client'
import { createClient } from '@libsql/client'
import fs from 'fs'
import path from 'path'

export async function migrateToTurso() {
  // Environment validation
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('Migration can only be run in development environment')
  }

  if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
    throw new Error('Turso credentials are required')
  }

  console.log('Starting migration to Turso production database...')
  
  // Check if local database exists
  const dbPath = path.resolve(process.cwd(), 'prisma/dev.db')
  if (!fs.existsSync(dbPath)) {
    throw new Error(`Local database not found at ${dbPath}`)
  }
  console.log('✓ Local database found')

  // Initialize clients
  console.log('Initializing database clients...')
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: `file:${dbPath}`
      }
    }
  })
  
  const turso = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  })

  try {
    // Verify Turso connection
    console.log('Verifying Turso connection...')
    await turso.execute('SELECT 1')
    console.log('✓ Turso connection verified')

    // Verify Prisma connection
    console.log('Verifying Prisma connection...')
    await prisma.$queryRaw`SELECT 1`
    console.log('✓ Prisma connection verified')

    // Fetch all data from local database
    console.log('\nFetching data from local database...')
    
    const users = await prisma.user.findMany()
    console.log('✓ Users fetched:', users.length)
    
    const exercises = await prisma.exercise.findMany()
    console.log('✓ Exercises fetched:', exercises.length)
    
    const workoutEntries = await prisma.workoutEntry.findMany()
    console.log('✓ Workout entries fetched:', workoutEntries.length)

    // Migrate users first (they're referenced by other tables)
    console.log('\nMigrating users...')
    for (const user of users) {
      await turso.execute({
        sql: `INSERT INTO User (id, email, name, passwordHash, weightUnit, barbellWeight, createdAt, updatedAt) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          user.id,
          user.email,
          user.name || null,
          user.passwordHash,
          user.weightUnit,
          user.barbellWeight,
          user.createdAt.toISOString(),
          user.updatedAt.toISOString()
        ]
      })
    }
    console.log('✓ Users migrated')

    // Migrate exercises
    console.log('\nMigrating exercises...')
    for (const exercise of exercises) {
      await turso.execute({
        sql: `INSERT INTO Exercise (id, name, isDefault, canUseBarbell, userId, createdAt, updatedAt) 
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          exercise.id,
          exercise.name,
          exercise.isDefault ? 1 : 0,
          exercise.canUseBarbell ? 1 : 0,
          exercise.userId,
          exercise.createdAt.toISOString(),
          exercise.updatedAt.toISOString()
        ]
      })
    }
    console.log('✓ Exercises migrated')

    // Migrate workout entries
    console.log('\nMigrating workout entries...')
    for (const entry of workoutEntries) {
      await turso.execute({
        sql: `INSERT INTO WorkoutEntry (id, date, weight, reps, sets, comments, exerciseId, userId, createdAt, updatedAt) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          entry.id,
          entry.date.toISOString(),
          entry.weight,
          entry.reps,
          entry.sets,
          entry.comments || null,
          entry.exerciseId,
          entry.userId,
          entry.createdAt.toISOString(),
          entry.updatedAt.toISOString()
        ]
      })
    }
    console.log('✓ Workout entries migrated')

    console.log('\n✓ Migration completed successfully!')
    return {
      success: true,
      stats: {
        users: users.length,
        exercises: exercises.length,
        workoutEntries: workoutEntries.length
      }
    }

  } catch (error) {
    console.error('\n✗ Migration failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }
  } finally {
    await prisma.$disconnect()
  }
} 