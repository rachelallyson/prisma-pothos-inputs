/**
 * Prisma v7 client: uses driver adapter and connection URL from env.
 * Re-export Prisma namespace so verify-types and schema can use generated types.
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import type { Prisma } from '../generated/prisma/client.js';

const connectionString = process.env.DATABASE_URL ?? 'postgresql://localhost:5432/pothos_example';
const adapter = new PrismaPg({ connectionString });
export const prisma = new PrismaClient({ adapter });
export type { Prisma };
