import { PrismaClient } from '@prisma/client'
import { initDatabase } from './db-init'

// Initialize database file and get the path
const dbPath = initDatabase()

// Initialize Prisma Client with the correct database URL
const prismaClientSingleton = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: `file:${dbPath}?connection_limit=1`
      }
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
  })
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

export const prisma = globalThis.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
} 