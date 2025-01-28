import { PrismaClient } from '@prisma/client'

// Create a dedicated Prisma client for magic link operations
const createMagicLinkClient = () => {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');

  // Parse and clean the URL
  const urlObj = new URL(url);
  
  // Force specific connection settings for magic link operations
  const cleanUrl = `${urlObj.protocol}//${urlObj.username}@${urlObj.hostname}/db?schema=public&sslmode=require&connection_limit=1&connect_timeout=30`;
  
  console.log('Magic Link DB URL:', cleanUrl.replace(/\/\/[^@]+@/, '//****@'));

  return new PrismaClient({
    log: ['error', 'warn'],
    datasources: {
      db: {
        url: cleanUrl
      }
    }
  });
};

// Export a singleton instance
export const magicLinkDb = createMagicLinkClient(); 
