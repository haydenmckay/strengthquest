import { PrismaClient } from '@prisma/client'
import { createClient } from '@libsql/client';

// Debug: Log the database URL (but mask the auth token)
const dbUrl = process.env.DATABASE_URL || '';
console.log('Database URL format:', dbUrl.replace(/\/\/[^@]+@/, '//****@'));

declare global {
  var prisma: PrismaClient | undefined
}

const prismaClientSingleton = () => {
  const url = process.env.DATABASE_URL;
  const directUrl = process.env.DIRECT_URL;
  
  if (!url || !directUrl) throw new Error('DATABASE_URL or DIRECT_URL is not set');

  return new PrismaClient({
    log: ['error', 'warn'],
    datasources: {
      db: {
        url: directUrl
      }
    }
  })
}

export const prisma = globalThis.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
} 