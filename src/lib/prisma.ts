import { PrismaClient } from '@prisma/client'

// Debug: Log the database URL (but mask the auth token)
const dbUrl = process.env.DATABASE_URL || '';
console.log('Database URL format:', dbUrl.replace(/\/\/[^@]+@/, '//****@'));

declare global {
  var prisma: PrismaClient | undefined
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ['query', 'error', 'warn']
  })
}

export const prisma = globalThis.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
} 