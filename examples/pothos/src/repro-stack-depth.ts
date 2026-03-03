/**
 * Repro: InternalArgs vs DefaultArgs when spreading ...query into findMany.
 *
 * We are NOT building query wrong — we don't build it at all. The Pothos plugin
 * builds the query value at runtime (queryFromInfo from the GraphQL selection).
 * The plugin types the resolve's first argument from the schema's PrismaTypes
 * (Model['Select']/['Include']), which can use a different Args context than the
 * actual client's findMany(). So the *value* is correct; the *type* can be wrong.
 *
 * To see the type error: remove the @ts-expect-error on findManyWithSpread and run:
 *   npm run repro:stack-depth
 *
 * Fix: cast query when spreading so TS doesn't recurse: ...(query as object)
 */
import { PrismaClient } from '../generated/prisma/client.js';
import type { Prisma } from '../generated/prisma/client.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const base = null as any as PrismaClient;
const extended = base.$extends({ name: 'x', client: {} });
type ExtendedPrisma = typeof extended;

// Query type as from Pothos plugin when schema uses extended client (InternalArgs)
type QueryFromPlugin = Parameters<ExtendedPrisma['user']['findMany']>[0];
declare const basePrisma: PrismaClient;

// This line fails type-check: InternalArgs (query) vs DefaultArgs (findMany param).
// On larger schemas the same mismatch can surface as TS2321 "Excessive stack depth".
function findManyWithSpread(query: QueryFromPlugin, args: Prisma.UserFindManyArgs | undefined) {
  // @ts-expect-error - Intentional repro: ...query causes InternalArgs vs DefaultArgs (or stack depth on large schemas)
  return basePrisma.user.findMany({
    ...query,
    ...(args ?? {}),
  });
}

function findManyWithFix(query: QueryFromPlugin, args: Prisma.UserFindManyArgs | undefined) {
  return basePrisma.user.findMany({
    ...(query as object),
    ...(args ?? {}),
  } as Prisma.UserFindManyArgs);
}

export { findManyWithSpread, findManyWithFix };
