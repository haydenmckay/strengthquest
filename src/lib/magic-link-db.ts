import { PrismaClient } from '@prisma/client'

// Create a dedicated Prisma client for magic link operations
const createMagicLinkClient = () => {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');

  // Parse and clean the URL
  const urlObj = new URL(url);
  
  return new PrismaClient({
    log: ['error', 'warn', 'query'],
    datasourceUrl: url,
    datasources: {
      db: {
        url
      }
    },
    // Add explicit connection configuration
    __internal: {
      engine: {
        cwd: process.cwd(),
        binaryTarget: 'debian-openssl-3.0.x',
        engineConfig: {
          noEngine: true
        }
      }
    }
  });
};

// Export a singleton instance
export const magicLinkDb = createMagicLinkClient(); 
