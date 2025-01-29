import { PrismaClient } from '@prisma/client'

// Create a dedicated Prisma client for magic link operations
const createMagicLinkClient = () => {
  return new PrismaClient({
    log: ['error', 'warn']
  });
};

// Export a singleton instance
export const magicLinkDb = createMagicLinkClient(); 
