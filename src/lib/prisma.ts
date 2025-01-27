import { PrismaClient } from '@prisma/client'
import { initDatabase } from './db-init'

// Initialize database file
initDatabase()

// Initialize Prisma Client
const prismaClientSingleton = () => {
  return new PrismaClient()
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

export const prisma = globalThis.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
} 