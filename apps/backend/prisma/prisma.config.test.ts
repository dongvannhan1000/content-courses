// prisma.config.test.ts
// Config file for running Prisma CLI commands against the test database
import path from 'node:path';
import { defineConfig } from '@prisma/config';
import { config } from 'dotenv';

// Load .env.test file for test database
config({ path: path.join(__dirname, '..', '.env.test') });

export default defineConfig({
    schema: path.join(__dirname, 'schema.prisma'),
    migrations: {
        seed: 'tsx prisma/seed.ts',
    },
    datasource: {
        url: process.env.DATABASE_URL!,
    },
});
