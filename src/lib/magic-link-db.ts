import { PrismaClient } from '@prisma/client'

// Create a dedicated Prisma client for magic link operations
const createMagicLinkClient = () => {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');

  console.log('Magic Link DB URL:', url.replace(/\/\/[^@]+@/, '//****@'));

  return new PrismaClient({
    log: ['query', 'error', 'warn'],
    datasources: {
      db: {
        url
      }
    }
  });
};

// Export a singleton instance
export const magicLinkDb = createMagicLinkClient(); 
