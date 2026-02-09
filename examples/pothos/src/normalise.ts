/**
 * Normalise GraphQL input (null for optional) to Prisma input (undefined for optional).
 * Accepts unknown so Pothos-inferred args can be passed without casts at the call site.
 */
import type { Prisma } from './db.js';

export function toPrismaUserCreateInput(data: unknown): Prisma.UserCreateInput {
  const d = data as Prisma.UserCreateInput;
  return {
    ...d,
    id: d.id ?? undefined,
    name: d.name ?? undefined,
  };
}

export function toPrismaPostCreateInput(data: unknown): Prisma.PostUncheckedCreateInput {
  const d = data as Prisma.PostUncheckedCreateInput;
  return {
    ...d,
    id: d.id ?? undefined,
    content: d.content ?? undefined,
  };
}
