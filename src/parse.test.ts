import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parsePrismaSchema } from './parse.js';
import { PRISMA_SCALAR_TO_GRAPHQL } from './types.js';

describe('parsePrismaSchema', () => {
  it('returns empty models and enums for schema with only datasource and generator', () => {
    const source = `
      generator client {
        provider = "prisma-client-js"
      }
      datasource db {
        provider = "postgresql"
        url      = env("DATABASE_URL")
      }
    `;
    const result = parsePrismaSchema(source);
    assert.strictEqual(result.models.length, 0);
    assert.strictEqual(result.enums.length, 0);
  });

  it('returns empty models and enums for empty schema (only blocks with no models/enums)', () => {
    const result = parsePrismaSchema('');
    assert.strictEqual(result.models.length, 0);
    assert.strictEqual(result.enums.length, 0);
  });

  it('parses a single model with scalar fields only', () => {
    const source = `
      model User {
        id    String  @id @default(cuid())
        email String  @unique
        name  String?
      }
    `;
    const result = parsePrismaSchema(source);
    assert.strictEqual(result.models.length, 1);
    assert.strictEqual(result.models[0]!.name, 'User');
    assert.strictEqual(result.models[0]!.fields.length, 3);
    assert.strictEqual(result.models[0]!.relationNames.length, 0);

    const idField = result.models[0]!.fields.find((f) => f.name === 'id');
    assert.ok(idField);
    assert.strictEqual(idField!.kind, 'scalar');
    assert.strictEqual(idField!.graphqlType, 'String!');
    assert.strictEqual(idField!.prismaType, 'String');
    assert.strictEqual(idField!.optional, false);
    assert.strictEqual(idField!.isList, false);
    assert.strictEqual(idField!.isId, true);
    assert.strictEqual(idField!.isUnique, false);

    const emailField = result.models[0]!.fields.find((f) => f.name === 'email');
    assert.ok(emailField);
    assert.strictEqual(emailField!.isUnique, true);
    assert.strictEqual(emailField!.graphqlType, 'String!');

    const nameField = result.models[0]!.fields.find((f) => f.name === 'name');
    assert.ok(nameField);
    assert.strictEqual(nameField!.optional, true);
    assert.strictEqual(nameField!.graphqlType, 'String');
  });

  it('parses enum and model with enum field', () => {
    const source = `
      enum Role {
        USER
        ADMIN
      }
      model User {
        id   String @id
        role Role   @default(USER)
      }
    `;
    const result = parsePrismaSchema(source);
    assert.strictEqual(result.enums.length, 1);
    assert.strictEqual(result.enums[0]!.name, 'Role');
    assert.deepStrictEqual(result.enums[0]!.values, ['USER', 'ADMIN']);

    assert.strictEqual(result.models.length, 1);
    const roleField = result.models[0]!.fields.find((f) => f.name === 'role');
    assert.ok(roleField);
    assert.strictEqual(roleField!.kind, 'enum');
    assert.strictEqual(roleField!.prismaType, 'Role');
    assert.strictEqual(roleField!.graphqlType, 'Role!');
    assert.strictEqual(roleField!.hasDefault, true, 'role has @default so hasDefault should be true');
  });

  it('parses /// [TypeName] comment as jsonTypeRef for prisma-json-types-generator', () => {
    const source = `
      model User {
        id      String @id @default(cuid())
        /// [UserProfile]
        profile Json?
      }
    `;
    const result = parsePrismaSchema(source);
    const profileField = result.models[0]!.fields.find((f) => f.name === 'profile');
    assert.ok(profileField);
    assert.strictEqual(profileField!.jsonTypeRef, 'UserProfile');
    assert.strictEqual(profileField!.prismaType, 'Json');
  });

  it('parses relation fields and populates relationNames', () => {
    const source = `
      model User {
        id    String @id
        posts Post[]
      }
      model Post {
        id       String @id
        authorId String
        author   User   @relation(fields: [authorId], references: [id])
      }
    `;
    const result = parsePrismaSchema(source);
    assert.strictEqual(result.models.length, 2);

    const user = result.models.find((m) => m.name === 'User')!;
    assert.ok(user);
    assert.deepStrictEqual(user.relationNames, ['Post']);
    const postsField = user.fields.find((f) => f.name === 'posts');
    assert.ok(postsField);
    assert.strictEqual(postsField!.kind, 'relation');
    assert.strictEqual(postsField!.isList, true);
    assert.strictEqual(postsField!.graphqlType, '[Post!]!');
    assert.strictEqual(postsField!.relationTo, 'Post');

    const post = result.models.find((m) => m.name === 'Post')!;
    assert.ok(post);
    assert.deepStrictEqual(post.relationNames, ['User']);
    const authorField = post.fields.find((f) => f.name === 'author');
    assert.ok(authorField);
    assert.strictEqual(authorField!.kind, 'relation');
    assert.strictEqual(authorField!.isList, false);
    assert.strictEqual(authorField!.graphqlType, 'User!');
    assert.strictEqual(authorField!.relationTo, 'User');
  });

  it('maps optional relation to nullable GraphQL type', () => {
    const source = `
      model A {
        id String @id
      }
      model B {
        id String @id
        a  A?
      }
    `;
    const result = parsePrismaSchema(source);
    const b = result.models.find((m) => m.name === 'B')!;
    const aField = b.fields.find((f) => f.name === 'a')!;
    assert.strictEqual(aField.graphqlType, 'A');
  });

  it('maps all Prisma scalar types to correct GraphQL types', () => {
    const scalars = Object.keys(PRISMA_SCALAR_TO_GRAPHQL);
    const fields = scalars.map((s, i) => `  f${i} ${s}`).join('\n');
    const source = `model M {\n  id String @id\n${fields}\n}`;
    const result = parsePrismaSchema(source);
    assert.strictEqual(result.models.length, 1);
    const model = result.models[0]!;
    scalars.forEach((prismaType, i) => {
      const field = model.fields.find((f) => f.name === `f${i}`);
      assert.ok(field, `field f${i} (${prismaType}) should exist`);
      const expected = PRISMA_SCALAR_TO_GRAPHQL[prismaType];
      assert.ok(model.fields.some((f) => f.prismaType === prismaType && f.graphqlType.startsWith(expected)));
    });
  });

  it('maps unknown scalar to String', () => {
    const source = `
      model M {
        id String @id
        x  UnknownType
      }
    `;
    const result = parsePrismaSchema(source);
    const field = result.models[0]!.fields.find((f) => f.name === 'x')!;
    assert.strictEqual(field.kind, 'scalar');
    assert.strictEqual(field.graphqlType, 'String!');
  });

  it('parses list scalar and list enum', () => {
    const source = `
      enum E {
        A
        B
      }
      model M {
        id   String @id
        tags String[]
        opts E[]
      }
    `;
    const result = parsePrismaSchema(source);
    const model = result.models[0]!;
    const tags = model.fields.find((f) => f.name === 'tags')!;
    assert.strictEqual(tags.isList, true);
    assert.strictEqual(tags.graphqlType, '[String!]!');
    const opts = model.fields.find((f) => f.name === 'opts')!;
    assert.strictEqual(opts.kind, 'enum');
    assert.strictEqual(opts.isList, true);
    assert.strictEqual(opts.graphqlType, '[E!]!');
  });

  it('parses multiple models and multiple enums', () => {
    const source = `
      enum E1 {
        A
      }
      enum E2 {
        B
      }
      model M1 {
        id String @id
      }
      model M2 {
        id String @id
      }
    `;
    const result = parsePrismaSchema(source);
    assert.strictEqual(result.enums.length, 2);
    assert.strictEqual(result.models.length, 2);
    assert.ok(result.enums.some((e) => e.name === 'E1'));
    assert.ok(result.enums.some((e) => e.name === 'E2'));
    assert.ok(result.models.some((m) => m.name === 'M1'));
    assert.ok(result.models.some((m) => m.name === 'M2'));
  });

  it('parses view and type blocks as models', () => {
    const source = `
      view V {
        id String @id
      }
      type T {
        id String @id
      }
    `;
    const result = parsePrismaSchema(source);
    assert.strictEqual(result.models.length, 2);
    assert.ok(result.models.some((m) => m.name === 'V'));
    assert.ok(result.models.some((m) => m.name === 'T'));
  });

  it('throws on invalid Prisma schema syntax', () => {
    assert.throws(() => parsePrismaSchema('model M { id String @id'));
  });
});
