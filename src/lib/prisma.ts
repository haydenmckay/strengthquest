import { PrismaClient } from '@prisma/client'

// Debug: Log the database URL (but mask the auth token)
const dbUrl = process.env.DATABASE_URL || '';
console.log('Database URL format:', dbUrl.replace(/\/\/[^@]+@/, '//****@'));

declare global {
  var prisma: PrismaClient | undefined
}

const prismaClientSingleton = () => {
  const isProduction = process.env.NODE_ENV === 'production'
  const dbUrl = process.env.DATABASE_URL

  // In production, we expect a Turso URL
  // In development, we use a local SQLite file
  const url = isProduction
    ? dbUrl
    : 'file:./prisma/dev.db'

  if (isProduction && !dbUrl) {
    throw new Error('DATABASE_URL environment variable is not set in production')
  }

  return new PrismaClient({
    log: ['error', 'warn'],
    datasources: {
      db: {
        url
      }
    }
  })
}

export const prisma = globalThis.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
} 