import fs from 'fs'
import path from 'path'

export function initDatabase() {
  // In production, use the mounted volume path
  const dbPath = process.env.NODE_ENV === 'production'
    ? '/data/prod.db'
    : path.resolve(process.cwd(), 'prisma/prod.db')

  const dbDir = path.dirname(dbPath)

  // Ensure the directory exists
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }

  // Create the database file if it doesn't exist
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, '')
  }

  // Ensure the file is writable
  try {
    fs.accessSync(dbPath, fs.constants.W_OK)
  } catch (error) {
    console.error('Database file is not writable:', error)
    fs.chmodSync(dbPath, 0o666)
  }

  return dbPath
} 