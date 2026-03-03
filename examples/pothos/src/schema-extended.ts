/**
 * Example: Pothos schema using an extended Prisma client ($extends) with PrismaTypes
 * generated from that extended client. This makes findMany({ ...query, ...args.input })
 * type-check with no assertion.
 *
 * Prerequisites:
 *   1. Run: npm run generate:prisma-types-extended
 *   2. PrismaTypes come from __generated__/pothos-prisma-extended.ts (derived from db-extended)
 *   3. Builder and context use the same extended client from db-extended.ts
 */
import SchemaBuilder from '@pothos/core';
import PrismaPlugin from '@pothos/plugin-prisma';
import extendedPrisma from './db-extended.js';
import type PrismaTypes from './__generated__/pothos-prisma-extended.js';
import { getDatamodel } from './__generated__/pothos-prisma.js';
import { registerPothosTypes } from './__generated__/pothos-inputs.js';

const builder = new SchemaBuilder<{
  PrismaTypes: PrismaTypes;
  Scalars: {
    DateTime: { Input: Date; Output: Date };
  };
}>({
  plugins: [PrismaPlugin],
  prisma: {
    client: extendedPrisma,
    dmmf: getDatamodel(),
  },
});

const refs = registerPothosTypes(builder);

builder.prismaObject('User', {
  fields: (t) => ({
    id: t.exposeID('id'),
    email: t.exposeString('email'),
    name: t.exposeString('name', { nullable: true }),
    role: t.expose('role', { type: refs.Role }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    posts: t.relation('posts'),
  }),
});

builder.prismaObject('Post', {
  fields: (t) => ({
    id: t.exposeID('id'),
    title: t.exposeString('title'),
    content: t.exposeString('content', { nullable: true }),
    published: t.exposeBoolean('published'),
    authorId: t.exposeString('authorId'),
    author: t.relation('author'),
  }),
});

builder.queryType({
  fields: (t) => ({
    user: t.prismaField({
      type: 'User',
      args: {
        where: t.arg({ type: refs.UserWhereUniqueInputType, required: true }),
      },
      resolve: (query, _root, args) =>
        extendedPrisma.user.findUnique({
          ...query,
          where: args.where,
        }),
    }),
    users: t.prismaField({
      type: ['User'],
      args: {
        input: t.arg({ type: refs.UserFindManyArgs, required: false }),
      },
      // No assertion: PrismaTypes from extended client, so query and findMany types match.
      resolve: (query, _root, args) =>
        extendedPrisma.user.findMany({ ...query, ...(args.input ?? {}) }),
    }),
    post: t.prismaField({
      type: 'Post',
      args: {
        where: t.arg({ type: refs.PostWhereUniqueInputType, required: true }),
      },
      resolve: (query, _root, args) =>
        extendedPrisma.post.findUnique({
          ...query,
          where: args.where,
        }),
    }),
    posts: t.prismaField({
      type: ['Post'],
      args: {
        input: t.arg({ type: refs.PostFindManyArgs, required: false }),
      },
      resolve: (query, _root, args) =>
        extendedPrisma.post.findMany({ ...query, ...(args.input ?? {}) }),
    }),
  }),
});

builder.mutationType({
  fields: (t) => ({
    createUser: t.prismaField({
      type: 'User',
      args: {
        data: t.arg({ type: refs.UserCreateInputType, required: true }),
      },
      resolve: async (_query, _root, args) =>
        extendedPrisma.user.create({ data: args.data }),
    }),
    updateUser: t.prismaField({
      type: 'User',
      args: {
        where: t.arg({ type: refs.UserWhereUniqueInputType, required: true }),
        data: t.arg({ type: refs.UserUpdateInputType, required: true }),
      },
      resolve: async (_query, _root, args) =>
        extendedPrisma.user.update({ where: args.where, data: args.data }),
    }),
    deleteUser: t.prismaField({
      type: 'User',
      args: {
        where: t.arg({ type: refs.UserWhereUniqueInputType, required: true }),
      },
      resolve: async (_query, _root, args) =>
        extendedPrisma.user.delete({ where: args.where }),
    }),
    updateManyUsers: t.field({
      type: refs.BatchPayloadType,
      args: {
        where: t.arg({ type: refs.UserWhereInputType, required: false }),
        data: t.arg({ type: refs.UserUpdateInputType, required: true }),
      },
      resolve: async (_root, args) =>
        extendedPrisma.user.updateMany({ where: args.where ?? {}, data: args.data }),
    }),
    createPost: t.prismaField({
      type: 'Post',
      args: {
        data: t.arg({ type: refs.PostCreateInputType, required: true }),
      },
      resolve: async (_query, _root, args) =>
        extendedPrisma.post.create({ data: args.data }),
    }),
    updatePost: t.prismaField({
      type: 'Post',
      args: {
        where: t.arg({ type: refs.PostWhereUniqueInputType, required: true }),
        data: t.arg({ type: refs.PostUpdateInputType, required: true }),
      },
      resolve: async (_query, _root, args) =>
        extendedPrisma.post.update({ where: args.where, data: args.data }),
    }),
    deletePost: t.prismaField({
      type: 'Post',
      args: {
        where: t.arg({ type: refs.PostWhereUniqueInputType, required: true }),
      },
      resolve: async (_query, _root, args) =>
        extendedPrisma.post.delete({ where: args.where }),
    }),
    updateManyPosts: t.field({
      type: refs.BatchPayloadType,
      args: {
        where: t.arg({ type: refs.PostWhereInputType, required: false }),
        data: t.arg({ type: refs.PostUpdateInputType, required: true }),
      },
      resolve: async (_root, args) =>
        extendedPrisma.post.updateMany({ where: args.where ?? {}, data: args.data }),
    }),
  }),
});

export const schema = builder.toSchema();
