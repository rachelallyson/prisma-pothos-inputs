/**
 * Extended Prisma client for the "extended PrismaTypes" example.
 * Export the type so the generator can emit PrismaTypes from it (--extended-prisma-type-path).
 * Using $extends makes the client use InternalArgs; PrismaTypes generated from ExtendedPrisma
 * keep resolve `query` in sync so findMany({ ...query, ...args.input }) type-checks.
 */
import { prisma } from './db.js';

const extended = prisma.$extends({
  name: 'example',
  query: {
    // No-op: we only need the extended type for the example.
  },
});

export default extended;
/** Export the type so generated PrismaTypes can use it (no value reference in type-only import). */
export type ExtendedPrisma = typeof extended;
