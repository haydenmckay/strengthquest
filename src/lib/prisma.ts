import { PrismaClient } from '@prisma/client'

// Debug: Log the database URL (but mask the auth token)
const dbUrl = process.env.DATABASE_URL || '';
console.log('Database URL format:', dbUrl.replace(/\/\/[^@]+@/, '//****@'));

declare global {
  var prisma: PrismaClient | undefined
}

const prismaClientSingleton = () => {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');

  // Parse the URL to remove port if present
  const urlObj = new URL(url);
  const cleanUrl = `${urlObj.protocol}//${urlObj.username}@${urlObj.hostname}${urlObj.pathname}${urlObj.search}`;

  return new PrismaClient({
    log: ['query', 'error', 'warn'],
    datasources: {
      db: {
        url: cleanUrl
      }
    }
  })
}

export const prisma = globalThis.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
} 