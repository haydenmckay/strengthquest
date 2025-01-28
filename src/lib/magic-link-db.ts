import { PrismaClient } from '@prisma/client'

// Create a dedicated Prisma client for magic link operations
const createMagicLinkClient = () => {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');

  // Parse and clean the URL
  const urlObj = new URL(url);
  const cleanUrl = `${urlObj.protocol}//${urlObj.username}@${urlObj.hostname}/db`;
  
  console.log('Magic Link DB URL:', cleanUrl.replace(/\/\/[^@]+@/, '//****@'));

  return new PrismaClient();
};

// Export a singleton instance
export const magicLinkDb = createMagicLinkClient(); 
