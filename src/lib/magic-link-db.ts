import { PrismaClient } from '@prisma/client'

// Create a dedicated Prisma client for magic link operations
const createMagicLinkClient = () => {
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
  });
};

// Export a singleton instance
export const magicLinkDb = createMagicLinkClient(); 
