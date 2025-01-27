import { createClient } from '@libsql/client'

const createUserTable = `
  CREATE TABLE IF NOT EXISTS User (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    passwordHash TEXT NOT NULL,
    weightUnit TEXT NOT NULL DEFAULT 'kg',
    barbellWeight REAL NOT NULL DEFAULT 20,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  )
`

const createExerciseTable = `
  CREATE TABLE IF NOT EXISTS Exercise (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    isDefault INTEGER NOT NULL DEFAULT 0,
    canUseBarbell INTEGER NOT NULL DEFAULT 1,
    userId TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES User(id)
  )
`

const createWorkoutEntryTable = `
  CREATE TABLE IF NOT EXISTS WorkoutEntry (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    weight REAL NOT NULL,
    reps INTEGER NOT NULL,
    sets INTEGER NOT NULL,
    comments TEXT,
    exerciseId TEXT NOT NULL,
    userId TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    FOREIGN KEY (exerciseId) REFERENCES Exercise(id),
    FOREIGN KEY (userId) REFERENCES User(id)
  )
`

export async function initializeSchema() {
  console.log('Initializing Turso schema...')
  
  if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
    throw new Error('Turso credentials are required')
  }

  const turso = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  })

  try {
    // Create tables
    await turso.execute(createUserTable)
    console.log('✓ User table initialized')
    
    await turso.execute(createExerciseTable)
    console.log('✓ Exercise table initialized')
    
    await turso.execute(createWorkoutEntryTable)
    console.log('✓ WorkoutEntry table initialized')

    return { success: true }
  } catch (error) {
    console.error('Schema initialization failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
} 