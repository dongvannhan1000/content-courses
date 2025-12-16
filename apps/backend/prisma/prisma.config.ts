// prisma.config.ts
import path from 'node:path';
import { defineConfig } from '@prisma/config';
import { config } from 'dotenv';

// Load .env file
config({ path: path.join(__dirname, '..', '.env') });

export default defineConfig({
  schema: path.join(__dirname, 'schema.prisma'),
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
