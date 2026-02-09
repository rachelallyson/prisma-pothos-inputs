/**
 * Pothos schema: types (scalars, enums, input types) come from @rachelallyson/prisma-pothos-inputs
 * generated code. This file only wires the builder, Prisma objects, and resolvers.
 */
import SchemaBuilder from '@pothos/core';
import PrismaPlugin from '@pothos/plugin-prisma';
import { prisma } from './db.js';
import type PrismaTypes from './__generated__/pothos-prisma.js';
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
    client: prisma,
    dmmf: getDatamodel(),
  },
});

const refs = registerPothosTypes(builder);

// Prisma object types (only wiring; shape comes from Prisma)
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
    // User: findUnique, findMany
    user: t.prismaField({
      type: 'User',
      args: {
        where: t.arg({ type: refs.UserWhereUniqueInputType, required: true }),
      },
      resolve: (query, _root, args) =>
        prisma.user.findUnique({
          ...query,
          where: args.where,
        }),
    }),
    users: t.prismaField({
      type: ['User'],
      args: {
        input: t.arg({ type: refs.UserFindManyArgs, required: false }),
      },
      resolve: (query, _root, args) =>
        prisma.user.findMany({
          ...query,
          ...(args.input ?? {}),
        }),
    }),
    // Post: findUnique, findMany
    post: t.prismaField({
      type: 'Post',
      args: {
        where: t.arg({ type: refs.PostWhereUniqueInputType, required: true }),
      },
      resolve: (query, _root, args) =>
        prisma.post.findUnique({
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
        prisma.post.findMany({
          ...query,
          ...(args.input ?? {}),
        }),
    }),
  }),
});

builder.mutationType({
  fields: (t) => ({
    // User: createOne, updateOne, deleteOne
    createUser: t.prismaField({
      type: 'User',
      args: {
        data: t.arg({ type: refs.UserCreateInputType, required: true }),
      },
      resolve: async (_query, _root, args) =>
        prisma.user.create({ data: args.data }),
    }),
    updateUser: t.prismaField({
      type: 'User',
      args: {
        where: t.arg({ type: refs.UserWhereUniqueInputType, required: true }),
        data: t.arg({ type: refs.UserUpdateInputType, required: true }),
      },
      resolve: async (_query, _root, args) =>
        prisma.user.update({ where: args.where, data: args.data }),
    }),
    deleteUser: t.prismaField({
      type: 'User',
      args: {
        where: t.arg({ type: refs.UserWhereUniqueInputType, required: true }),
      },
      resolve: async (_query, _root, args) =>
        prisma.user.delete({ where: args.where }),
    }),
    updateManyUsers: t.field({
      type: refs.BatchPayloadType,
      args: {
        where: t.arg({ type: refs.UserWhereInputType, required: false }),
        data: t.arg({ type: refs.UserUpdateInputType, required: true }),
      },
      resolve: async (_root, args) =>
        prisma.user.updateMany({ where: args.where ?? {}, data: args.data }),
    }),
    // Post: createOne, updateOne, deleteOne, updateMany
    createPost: t.prismaField({
      type: 'Post',
      args: {
        data: t.arg({ type: refs.PostCreateInputType, required: true }),
      },
      resolve: async (_query, _root, args) =>
        prisma.post.create({ data: args.data }),
    }),
    updatePost: t.prismaField({
      type: 'Post',
      args: {
        where: t.arg({ type: refs.PostWhereUniqueInputType, required: true }),
        data: t.arg({ type: refs.PostUpdateInputType, required: true }),
      },
      resolve: async (_query, _root, args) =>
        prisma.post.update({ where: args.where, data: args.data }),
    }),
    deletePost: t.prismaField({
      type: 'Post',
      args: {
        where: t.arg({ type: refs.PostWhereUniqueInputType, required: true }),
      },
      resolve: async (_query, _root, args) =>
        prisma.post.delete({ where: args.where }),
    }),
    updateManyPosts: t.field({
      type: refs.BatchPayloadType,
      args: {
        where: t.arg({ type: refs.PostWhereInputType, required: false }),
        data: t.arg({ type: refs.PostUpdateInputType, required: true }),
      },
      resolve: async (_root, args) =>
        prisma.post.updateMany({ where: args.where ?? {}, data: args.data }),
    }),
  }),
});

export const schema = builder.toSchema();
