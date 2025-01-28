import { PrismaClient } from '@prisma/client'
import { initDatabase } from './db-init'

// Initialize database file and get the path
const dbPath = initDatabase()

declare global {
  var prisma: PrismaClient | undefined
}

export const prisma = globalThis.prisma || new PrismaClient({
  log: ['query', 'error', 'warn'],
})

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
} 