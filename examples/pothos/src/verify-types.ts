/**
 * Type verification: GraphQL-generated input types (from @rachelallyson/prisma-pothos-inputs
 * schema + codegen) must be assignable to Prisma's generated types after
 * normalising optional fields (GraphQL uses null, Prisma uses undefined).
 * This file has no runtime behavior; it exists so that `tsc` will fail if
 * the shapes drift apart.
 */
import type { Prisma } from './db.js';
import type { UserCreateInput, PostCreateInput } from './__generated__/graphql.js';

function normaliseUserInput(data: UserCreateInput): Prisma.UserCreateInput {
  return {
    id: data.id ?? undefined,
    email: data.email,
    name: data.name ?? undefined,
    role: data.role ?? undefined,
    createdAt: data.createdAt ?? undefined,
  };
}

function normalisePostInput(data: PostCreateInput): Prisma.PostCreateInput {
  return {
    id: data.id ?? undefined,
    title: data.title,
    content: data.content ?? undefined,
    published: data.published ?? undefined,
    author: data.author,
  };
}

// If these assignments type-check, our generated GraphQL input types are
// compatible with Prisma's expected inputs (after normalisation).
const _userCreate: Prisma.UserCreateInput = normaliseUserInput({
  email: 'x@example.com',
  role: 'USER',
  createdAt: new Date(),
});
// Relation-style create: author.connect or author.create or author.connectOrCreate
const _postCreateConnect: Prisma.PostCreateInput = normalisePostInput({
  title: 'Title',
  published: false,
  author: { connect: { id: 'author-id' } },
});
const _postCreateNested: Prisma.PostCreateInput = normalisePostInput({
  title: 'Title',
  published: false,
  author: {
    create: {
      email: 'new@example.com',
      name: 'Author',
      role: 'USER',
    },
  },
});

export type { UserCreateInput, PostCreateInput };
