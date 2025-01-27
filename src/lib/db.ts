import { createClient } from '@libsql/client'
import { PrismaClient } from '@prisma/client'
import { env } from 'process'

class Database {
  private static instance: Database
  private prisma: PrismaClient
  private turso: ReturnType<typeof createClient> | null = null
  private readonly isProduction: boolean
  private readonly useTurso: boolean

  private constructor() {
    this.isProduction = process.env.NODE_ENV === 'production'
    this.useTurso = process.env.USE_TURSO === 'true'
    
    // Validate environment
    this.validateEnvironment()
    
    // Initialize Prisma
    this.prisma = new PrismaClient({
      log: this.isProduction ? ['error'] : ['query', 'error', 'warn'],
    })

    // Initialize Turso if needed
    if (this.useTurso) {
      this.initializeTurso()
    }
  }

  private validateEnvironment() {
    if (this.isProduction && !this.useTurso) {
      throw new Error('Production environment must use Turso')
    }

    if (this.useTurso) {
      if (!process.env.TURSO_DATABASE_URL) {
        throw new Error('TURSO_DATABASE_URL is required when using Turso')
      }
      if (!process.env.TURSO_AUTH_TOKEN) {
        throw new Error('TURSO_AUTH_TOKEN is required when using Turso')
      }
    }
  }

  private initializeTurso() {
    try {
      this.turso = createClient({
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN!,
      })
      console.log('Turso client initialized')
    } catch (error) {
      console.error('Failed to initialize Turso client:', error)
      throw error
    }
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database()
    }
    return Database.instance
  }

  public getClient() {
    if (this.useTurso && this.turso) {
      return this.turso
    }
    return this.prisma
  }

  public async healthCheck() {
    try {
      if (this.useTurso && this.turso) {
        await this.turso.execute('SELECT 1')
        return { status: 'healthy', mode: 'turso' }
      } else {
        await this.prisma.$queryRaw`SELECT 1`
        return { status: 'healthy', mode: 'prisma' }
      }
    } catch (error) {
      return { 
        status: 'unhealthy', 
        error: error instanceof Error ? error.message : 'Unknown error',
        mode: this.useTurso ? 'turso' : 'prisma'
      }
    }
  }
}

// Export a singleton instance
export const db = Database.getInstance() 