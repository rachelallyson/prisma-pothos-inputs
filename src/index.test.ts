import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  generatePothosFromSchema,
  parsePrismaSchema,
  generatePothosEnums,
  generatePothosSchema,
} from './index.js';

const schemaWithUserAndPost = `
  enum Role {
    USER
    ADMIN
  }
  model User {
    id    String   @id @default(cuid())
    email String   @unique
    role  Role     @default(USER)
    posts Post[]
  }
  model Post {
    id       String @id @default(cuid())
    title    String
    authorId String
    author   User   @relation(fields: [authorId], references: [id])
  }
`;

describe('parsePrismaSchema', () => {
  it('parses schema with User and Post models and Role enum', () => {
    const normalized = parsePrismaSchema(schemaWithUserAndPost);
    assert.strictEqual(normalized.models.length, 2);
    assert.strictEqual(normalized.enums.length, 1);
    assert.strictEqual(normalized.enums[0]!.name, 'Role');
    assert.deepStrictEqual(normalized.enums[0]!.values, ['USER', 'ADMIN']);
    const user = normalized.models.find((m) => m.name === 'User');
    const post = normalized.models.find((m) => m.name === 'Post');
    assert.ok(user);
    assert.ok(post);
  });
});

describe('generatePothosFromSchema', () => {
  it('returns TypeScript string with registerPothosTypes', () => {
    const ts = generatePothosFromSchema(schemaWithUserAndPost);
    assert.strictEqual(typeof ts, 'string');
    assert.ok(ts.length > 0);
    assert.ok(ts.includes('registerPothosTypes'));
  });

  it('output contains CreateInput, UpdateInput, WhereInput, and WhereUniqueInput per model', () => {
    const ts = generatePothosFromSchema(schemaWithUserAndPost);
    assert.ok(ts.includes('UserCreateInput'));
    assert.ok(ts.includes('UserUpdateInput'));
    assert.ok(ts.includes('PostCreateInput'));
    assert.ok(ts.includes('PostUpdateInput'));
    assert.ok(ts.includes('UserWhereInput'));
    assert.ok(ts.includes('PostWhereInput'));
    assert.ok(ts.includes('UserWhereUniqueInput'));
    assert.ok(ts.includes('PostWhereUniqueInput'));
  });

  it('fields with @default are optional in CreateInput', () => {
    const ts = generatePothosFromSchema(schemaWithUserAndPost);
    // User has id @default(cuid()) and role @default(USER) -> both optional in create
    assert.ok(
      ts.includes("role: t.field({ type: Role, required: false })") ||
        ts.includes('role: t.field({ type: Role, required: false }),'),
      'UserCreateInput should have role optional when it has @default'
    );
  });

  it('PostCreateInput includes authorId so Prisma create can connect by FK (UncheckedCreateInput)', () => {
    const ts = generatePothosFromSchema(schemaWithUserAndPost);
    // Post create input must expose authorId so clients can pass it (no nested author: { connect })
    assert.ok(
      ts.includes("authorId: t.string({ required: true })") ||
        ts.includes('authorId: t.string({ required: true }),'),
      'PostCreateInput should include authorId as required string'
    );
    const tsWithPrisma = generatePothosFromSchema(schemaWithUserAndPost, {
      prismaClientPath: '../../generated/prisma/client.js',
    });
    assert.ok(
      tsWithPrisma.includes('Prisma.PostUncheckedCreateInput'),
      'PostCreateInputType should be typed as Prisma.PostUncheckedCreateInput when prismaClientPath is set'
    );
  });

  it('output contains scalar and enum filter input types', () => {
    const ts = generatePothosFromSchema(schemaWithUserAndPost);
    assert.ok(ts.includes("builder.inputType('StringFilter'"));
    assert.ok(ts.includes("builder.inputType('IntFilter'"));
    assert.ok(ts.includes("builder.inputType('BooleanFilter'"));
    assert.ok(ts.includes("builder.inputType('DateTimeFilter'"));
    assert.ok(ts.includes("inputType('RoleFilter'"));
  });

  it('optional DateTime uses DateTimeNullableFilter so nested where deletedAt: { equals: null } works', () => {
    const schemaWithDeletedAt = `
      model Widget {
        id        String    @id @default(cuid())
        name      String
        deletedAt DateTime?
      }
    `;
    const ts = generatePothosFromSchema(schemaWithDeletedAt);
    assert.ok(ts.includes("builder.inputType('DateTimeNullableFilter'"));
    assert.ok(
      ts.includes("deletedAt: t.field({ type: 'DateTimeNullableFilter'"),
      'WidgetWhereInput should use DateTimeNullableFilter for optional deletedAt'
    );
  });

  it('output contains enum and OrderBy enums', () => {
    const ts = generatePothosFromSchema(schemaWithUserAndPost);
    assert.ok(ts.includes("builder.enumType('Role'"));
    assert.ok(ts.includes('UserOrderByInput'));
    assert.ok(ts.includes('PostOrderByInput'));
  });

  it('output contains DateTime scalar', () => {
    const ts = generatePothosFromSchema(schemaWithUserAndPost);
    assert.ok(ts.includes("builder.scalarType('DateTime'"));
  });

  it('output contains BatchPayload object type for updateMany/deleteMany', () => {
    const ts = generatePothosFromSchema(schemaWithUserAndPost);
    assert.ok(ts.includes("builder.objectRef<{ count: number }>('BatchPayload')"));
    assert.ok(ts.includes('BatchPayloadType'));
    assert.ok(ts.includes('return {') && ts.includes('BatchPayloadType'));
  });

  it('with prismaClientPath includes Prisma import and InputTypeRef types', () => {
    const ts = generatePothosFromSchema(schemaWithUserAndPost, {
      prismaClientPath: '../../generated/prisma/client.js',
    });
    assert.ok(ts.includes("from '../../generated/prisma/client.js'"));
    assert.ok(ts.includes('InputTypeRef') && ts.includes('Prisma.UserUncheckedCreateInput'));
    assert.ok(ts.includes('Prisma.PostUncheckedCreateInput'));
    assert.ok(ts.includes('Prisma.UserUncheckedUpdateInput'));
    assert.ok(ts.includes('Prisma.PostUncheckedUpdateInput'));
  });

  it('without prismaClientPath does not import Prisma', () => {
    const ts = generatePothosFromSchema(schemaWithUserAndPost);
    assert.ok(!ts.includes("from '"));
    assert.ok(!ts.includes('InputTypeRef<any, Prisma.'));
  });

  it('with useRelationInputs: true emits connect/create/connectOrCreate nested input types', () => {
    const ts = generatePothosFromSchema(schemaWithUserAndPost, {
      useRelationInputs: true,
    });
    assert.ok(
      ts.includes("builder.inputType('UserCreateWithoutPostsInput'"),
      'should emit UserCreateWithoutPostsInput'
    );
    assert.ok(
      ts.includes("builder.inputType('UserCreateOrConnectWithoutPostsInput'"),
      'should emit UserCreateOrConnectWithoutPostsInput'
    );
    assert.ok(
      ts.includes("builder.inputType('UserCreateNestedOneWithoutPostsInput'"),
      'should emit UserCreateNestedOneWithoutPostsInput'
    );
    assert.ok(
      ts.includes("connect: t.field({ type: 'UserWhereUniqueInput', required: false })"),
      'NestedOne should have connect'
    );
    assert.ok(
      ts.includes("create: t.field({ type: 'UserCreateWithoutPostsInput', required: false })"),
      'NestedOne should have create'
    );
    assert.ok(
      ts.includes("connectOrCreate: t.field({ type: 'UserCreateOrConnectWithoutPostsInput', required: false })"),
      'NestedOne should have connectOrCreate'
    );
  });

  it('with useRelationInputs: true PostCreateInput has author (nested) and no authorId', () => {
    const ts = generatePothosFromSchema(schemaWithUserAndPost, {
      useRelationInputs: true,
    });
    assert.ok(
      ts.includes("author: t.field({ type: 'UserCreateNestedOneWithoutPostsInput', required: true })"),
      'PostCreateInput should have author as nested relation input'
    );
    const postCreateInputStart = ts.indexOf("builder.inputType('PostCreateInput'");
    const postCreateInputEnd = ts.indexOf('});', postCreateInputStart) + 3;
    const postCreateBlock = ts.slice(postCreateInputStart, postCreateInputEnd);
    assert.ok(
      !postCreateBlock.includes('authorId:'),
      'PostCreateInput fields must not contain authorId when useRelationInputs is true'
    );
  });

  it('with useRelationInputs: true and prismaClientPath uses PostCreateInput ref', () => {
    const ts = generatePothosFromSchema(schemaWithUserAndPost, {
      useRelationInputs: true,
      prismaClientPath: '../../generated/prisma/client.js',
    });
    assert.ok(
      ts.includes('Prisma.PostCreateInput'),
      'PostCreateInputType should be Prisma.PostCreateInput when useRelationInputs and prismaClientPath are set'
    );
  });

  it('with useRelationInputs: true UserCreateInput has posts (CreateNestedMany) for create user with posts', () => {
    const ts = generatePothosFromSchema(schemaWithUserAndPost, {
      useRelationInputs: true,
    });
    assert.ok(
      ts.includes("builder.inputType('PostCreateNestedManyWithoutAuthorInput'"),
      'should emit PostCreateNestedManyWithoutAuthorInput'
    );
    assert.ok(
      ts.includes("posts: t.field({ type: 'PostCreateNestedManyWithoutAuthorInput', required: false })"),
      'UserCreateInput should have optional posts field for nested create'
    );
    assert.ok(
      ts.includes("PostCreateWithoutAuthorInput"),
      'PostCreateWithoutAuthorInput should exist (no authorId) for nested post create'
    );
  });

  it('with useRelationInputs: true emits CreateNestedManyWithoutX even when related model has no scalar fields (join table)', () => {
    // Parent has many Link; Link has only parentId (FK). CreateWithoutParent has no fields.
    // We must still emit LinkCreateNestedManyWithoutParentInput so ParentCreateInput can reference it.
    const schemaParentLink = `
      model Parent {
        id    String @id @default(cuid())
        links Link[]
      }
      model Link {
        parentId String
        parent   Parent @relation(fields: [parentId], references: [id])
        @@id([parentId])
      }
    `;
    const ts = generatePothosFromSchema(schemaParentLink, { useRelationInputs: true });
    assert.ok(
      ts.includes("builder.inputType('LinkCreateWithoutParentInput'"),
      'should emit LinkCreateWithoutParentInput (even with empty fields)'
    );
    assert.ok(
      ts.includes("builder.inputType('LinkCreateNestedManyWithoutParentInput'"),
      'should emit LinkCreateNestedManyWithoutParentInput so ParentCreateInput has links field'
    );
    assert.ok(
      ts.includes("links: t.field({ type: 'LinkCreateNestedManyWithoutParentInput', required: false })"),
      'ParentCreateInput should have optional links field'
    );
  });

  it('with useRelationInputs: true emits CreateNestedMany for self-relation when one-side is processed first', () => {
    const schemaSelfRelation = `
      model PeopleDepartment {
        id       String             @id @default(cuid())
        name     String
        parentId String?
        parent   PeopleDepartment?  @relation("DepartmentHierarchy", fields: [parentId], references: [id])
        children PeopleDepartment[] @relation("DepartmentHierarchy")
      }
    `;
    const ts = generatePothosFromSchema(schemaSelfRelation, { useRelationInputs: true });
    assert.ok(
      ts.includes("builder.inputType('PeopleDepartmentCreateNestedManyWithoutParentInput'"),
      'should emit PeopleDepartmentCreateNestedManyWithoutParentInput (list side) even if one-side was processed first'
    );
    assert.ok(
      ts.includes("children: t.field({ type: 'PeopleDepartmentCreateNestedManyWithoutParentInput', required: false })"),
      'PeopleDepartmentCreateInput should have children field'
    );
  });

  it('with useRelationInputs: true UpdateInput has nested relation types (connect, disconnect, update)', () => {
    const ts = generatePothosFromSchema(schemaWithUserAndPost, {
      useRelationInputs: true,
    });
    assert.ok(
      ts.includes("builder.inputType('UserUpdateOneRequiredWithoutPostsNestedInput'"),
      'should emit UserUpdateOneRequiredWithoutPostsNestedInput'
    );
    assert.ok(
      ts.includes("author: t.field({ type: 'UserUpdateOneRequiredWithoutPostsNestedInput', required: false })"),
      'PostUpdateInput should have author as nested update input'
    );
    assert.ok(
      ts.includes("disconnect: t.field({ type: 'Boolean', required: false })"),
      'UpdateOne nested should have disconnect'
    );
    assert.ok(
      ts.includes("update: t.field({ type: 'UserUpdateWithoutPostsInput', required: false })"),
      'UpdateOne nested should have update'
    );
  });

  it('with useRelationInputs: true exports all nested input types in return object', () => {
    const ts = generatePothosFromSchema(schemaWithUserAndPost, {
      useRelationInputs: true,
    });
    // Nested types are named const and included in the return so consumers can reference them
    assert.ok(
      ts.includes('PostCreateNestedOneWithoutAuthorInputType'),
      'should emit const PostCreateNestedOneWithoutAuthorInputType and include in return'
    );
    assert.ok(
      ts.includes('UserCreateWithoutPostsInputType'),
      'should emit const UserCreateWithoutPostsInputType and include in return'
    );
    assert.ok(
      ts.includes('UserUpdateOneRequiredWithoutPostsNestedInputType'),
      'should emit const UserUpdateOneRequiredWithoutPostsNestedInputType and include in return'
    );
    // Return object must list the ref
    assert.ok(
      /return\s*\{\s*[^}]*PostCreateNestedOneWithoutAuthorInputType\s*[^}]*\}\s*as\s*unknown/.test(ts.replace(/\s+/g, ' ')),
      'return object should include PostCreateNestedOneWithoutAuthorInputType'
    );
  });

  it('with includePrismaObjects: true emits builder.prismaObject for each model', () => {
    const ts = generatePothosFromSchema(schemaWithUserAndPost, {
      includePrismaObjects: true,
    });
    assert.ok(
      ts.includes("builder.prismaObject('User'"),
      'should emit builder.prismaObject for User'
    );
    assert.ok(
      ts.includes("builder.prismaObject('Post'"),
      'should emit builder.prismaObject for Post'
    );
    assert.ok(
      ts.includes("id: t.exposeID('id', { nullable: false })"),
      'User object should expose id as non-null ID'
    );
    assert.ok(
      ts.includes("role: t.expose('role', { type: Role"),
      'User object should expose role with enum type'
    );
    assert.ok(
      ts.includes("t.relation('posts'") && ts.includes('onNull'),
      'User object should have posts relation'
    );
    assert.ok(
      ts.includes("t.relation('author'") && ts.includes('onNull'),
      'Post object should have author relation'
    );
  });

  it('list relations get where/orderBy/take/skip args so nested where works', () => {
    const ts = generatePothosFromSchema(schemaWithUserAndPost, {
      includePrismaObjects: true,
    });
    assert.ok(
      ts.includes("where: t.arg({ type: 'PostWhereInput', required: false })"),
      'User.posts (list relation) should have where arg'
    );
    assert.ok(
      ts.includes("query: (args) => ({") && ts.includes('where: args.where'),
      'list relation should pass where through query'
    );
  });

  it('without includePrismaObjects does not emit builder.prismaObject', () => {
    const ts = generatePothosFromSchema(schemaWithUserAndPost);
    assert.ok(!ts.includes('builder.prismaObject('));
  });

  it('with omitPrismaObjectFields omits those fields from the given model prismaObject', () => {
    const ts = generatePothosFromSchema(schemaWithUserAndPost, {
      includePrismaObjects: true,
      omitPrismaObjectFields: {
        User: ['email'],
        Post: ['title'],
      },
    });
    // User prismaObject: from builder.prismaObject('User') up to builder.prismaObject('Post')
    const userBlockStart = ts.indexOf("builder.prismaObject('User'");
    const userBlockEnd = ts.indexOf("builder.prismaObject('Post'", userBlockStart);
    const userBlock = ts.slice(userBlockStart, userBlockEnd);
    assert.ok(!userBlock.includes("email: t."), 'User prismaObject should omit email when in omitPrismaObjectFields');
    assert.ok(userBlock.includes("id: t."), 'User prismaObject should still include id');
    // Post prismaObject: from builder.prismaObject('Post') to the return statement
    const postBlockStart = ts.indexOf("builder.prismaObject('Post'");
    const postBlockEnd = ts.indexOf('return {', postBlockStart);
    const postBlock = ts.slice(postBlockStart, postBlockEnd);
    assert.ok(!postBlock.includes("title: t."), 'Post prismaObject should omit title when in omitPrismaObjectFields');
    assert.ok(postBlock.includes("id: t."), 'Post prismaObject should still include id');
  });

  it('with usePrismaJsonTypes and /// [TypeName] on Json field, uses that type in prismaObject', () => {
    const schemaWithJson = `
      model User {
        id      String @id @default(cuid())
        /// [UserProfile]
        profile Json?
      }
    `;
    const ts = generatePothosFromSchema(schemaWithJson, {
      includePrismaObjects: true,
      usePrismaJsonTypes: true,
    });
    assert.ok(
      ts.includes("profile: t.expose('profile', { type: 'UserProfile'"),
      'Json field with /// [UserProfile] should use type UserProfile when usePrismaJsonTypes is true'
    );
  });

  it('without usePrismaJsonTypes Json fields stay as JSON type', () => {
    const schemaWithJson = `
      model User {
        id      String @id @default(cuid())
        /// [UserProfile]
        profile Json?
      }
    `;
    const ts = generatePothosFromSchema(schemaWithJson, {
      includePrismaObjects: true,
      usePrismaJsonTypes: false,
    });
    assert.ok(ts.includes("type: 'JSON'"));
  });
});

describe('regression: previously fixed bugs', () => {
  it('prismaObject id is non-null so client types get id: string not id?: string | null', () => {
    const ts = generatePothosFromSchema(schemaWithUserAndPost, {
      includePrismaObjects: true,
    });
    assert.ok(
      ts.includes("id: t.exposeID('id', { nullable: false })"),
      'id must be exposeID with nullable: false (Pothos v4 defaults to nullable)'
    );
    assert.ok(
      !ts.includes("id: t.exposeID('id'),"),
      'must not emit id without nullable: false (would make id optional in schema)'
    );
  });

  it('prismaObject required enum fields are non-null so client types get role: Role not role?: Role | null', () => {
    const ts = generatePothosFromSchema(schemaWithUserAndPost, {
      includePrismaObjects: true,
    });
    assert.ok(
      ts.includes("role: t.expose('role', { type: Role, nullable: false })"),
      'required enum role must have nullable: false so schema has role: Role!'
    );
  });

  it('prismaObject optional scalar with @default is non-null (field always has value in DB)', () => {
    const schemaWithDefault = `
      model MetricEntry {
        id      String  @id @default(cuid())
        content Float?  @default(0)
      }
    `;
    const ts = generatePothosFromSchema(schemaWithDefault, {
      includePrismaObjects: true,
    });
    assert.ok(
      ts.includes("content: t.exposeFloat('content', { nullable: false })"),
      'optional Float with @default(0) should be non-null in prismaObject (always has value)'
    );
  });

  it('relations use onNull: \'error\' and explicit nullable so plugin type is satisfied', () => {
    const ts = generatePothosFromSchema(schemaWithUserAndPost, {
      includePrismaObjects: true,
    });
    assert.ok(
      ts.includes("onNull: 'error'"),
      't.relation must receive onNull: \'error\' (plugin expects this, not empty object)'
    );
    assert.ok(
      ts.includes("t.relation('author'") && ts.includes('nullable: false'),
      'required single relation (Post.author) must have explicit nullable: false'
    );
  });

  it('optional DateTime uses DateTimeNullableFilter so nested where deletedAt: { equals: null } works', () => {
    const schemaWithDeletedAt = `
      model Widget {
        id        String    @id @default(cuid())
        name      String
        deletedAt DateTime?
      }
    `;
    const ts = generatePothosFromSchema(schemaWithDeletedAt);
    assert.ok(
      ts.includes("builder.inputType('DateTimeNullableFilter'"),
      'must emit DateTimeNullableFilter for optional DateTime'
    );
    assert.ok(
      ts.includes("deletedAt: t.field({ type: 'DateTimeNullableFilter'"),
      'WidgetWhereInput must use DateTimeNullableFilter for deletedAt so equals: null is valid'
    );
  });

  it('list relations have where arg and query so nested where is applied', () => {
    const ts = generatePothosFromSchema(schemaWithUserAndPost, {
      includePrismaObjects: true,
    });
    assert.ok(
      ts.includes("where: t.arg({ type: 'PostWhereInput', required: false })"),
      'list relation must have where arg'
    );
    assert.ok(
      ts.includes('query: (args) => ({') && ts.includes('where: args.where'),
      'list relation must pass where through query so nested filter is applied'
    );
  });

  it('list relations are non-null so client types get array not array | null', () => {
    const ts = generatePothosFromSchema(schemaWithUserAndPost, {
      includePrismaObjects: true,
    });
    assert.ok(
      ts.includes("t.relation('posts'") && ts.includes('nullable: false'),
      'list relation (e.g. User.posts) must have nullable: false so type is Array<...> not Array<...> | null'
    );
  });
});

describe('generatePothosSchema', () => {
  it('produces same result as parsePrismaSchema + generatePothosFromSchema', () => {
    const fromApi = generatePothosFromSchema(schemaWithUserAndPost);
    const normalized = parsePrismaSchema(schemaWithUserAndPost);
    const fromParts = generatePothosSchema(normalized);
    assert.strictEqual(fromApi, fromParts);
  });
});

describe('generatePothosEnums', () => {
  it('returns TypeScript with registerPothosEnums and enum values', () => {
    const normalized = parsePrismaSchema(schemaWithUserAndPost);
    const ts = generatePothosEnums(normalized);
    assert.ok(ts.includes('registerPothosEnums'));
    assert.ok(ts.includes("builder.enumType('Role'"));
    assert.ok(ts.includes("['USER', 'ADMIN']"));
    assert.ok(ts.includes('return { Role }'));
  });
});

describe('compound unique', () => {
  const schemaTeamCompoundUnique = `
    model Church {
      id    String @id @default(cuid())
      name  String
      teams Team[]
    }
    model User {
      id    String @id @default(cuid())
      teams Team[]
    }
    model Team {
      churchId String
      userId   String
      church   Church @relation(fields: [churchId], references: [id])
      user     User   @relation(fields: [userId], references: [id])
      @@unique([churchId, userId])
    }
  `;
  it('parses @@unique([a, b]) and emits WhereUniqueInput and compound unique input for model with no single-field unique', () => {
    const normalized = parsePrismaSchema(schemaTeamCompoundUnique);
    const team = normalized.models.find((m) => m.name === 'Team');
    assert.ok(team);
    assert.strictEqual(team.fields.filter((f) => f.isId || f.isUnique).length, 0);
    assert.strictEqual(team.compoundUniques?.length, 1);
    assert.deepStrictEqual(team.compoundUniques?.[0], {
      key: 'churchId_userId',
      fields: ['churchId', 'userId'],
    });
    const ts = generatePothosFromSchema(schemaTeamCompoundUnique);
    assert.ok(ts.includes('TeamWhereUniqueInput'));
    assert.ok(ts.includes('TeamWhereUniqueInputType'));
    assert.ok(ts.includes('TeamChurchidUseridCompoundUniqueInput'));
  });
  it('parses @@unique(name: "key", [a, b]) when array is not the first argument', () => {
    const schemaNamed = `
      model Team {
        churchId String
        userId   String
        @@unique(name: "teamChurchUser", [churchId, userId])
      }
    `;
    const normalized = parsePrismaSchema(schemaNamed);
    const team = normalized.models.find((m) => m.name === 'Team');
    assert.ok(team);
    assert.strictEqual(team.compoundUniques?.length, 1);
    assert.deepStrictEqual(team.compoundUniques?.[0]?.fields, ['churchId', 'userId']);
  });
  it('parses @@id([a, b]) and emits WhereUniqueInput and compound unique input (compound primary key)', () => {
    const schemaTeamCompoundId = `
      model Church {
        id    String @id @default(cuid())
        name  String
        teams Team[]
      }
      model User {
        id    String @id @default(cuid())
        teams Team[]
      }
      model Team {
        role      String   @default("EDITOR")
        createdAt String
        updatedAt String
        churchId  String
        userId    String
        church    Church @relation(fields: [churchId], references: [id])
        user      User   @relation(fields: [userId], references: [id])
        @@id([churchId, userId])
      }
    `;
    const normalized = parsePrismaSchema(schemaTeamCompoundId);
    const team = normalized.models.find((m) => m.name === 'Team');
    assert.ok(team);
    assert.strictEqual(team.fields.filter((f) => f.isId || f.isUnique).length, 0);
    assert.strictEqual(team.compoundUniques?.length, 1);
    assert.deepStrictEqual(team.compoundUniques?.[0], {
      key: 'churchId_userId',
      fields: ['churchId', 'userId'],
    });
    const ts = generatePothosFromSchema(schemaTeamCompoundId);
    assert.ok(ts.includes('TeamWhereUniqueInput'));
    assert.ok(ts.includes('TeamWhereUniqueInputType'));
    assert.ok(ts.includes('TeamChurchidUseridCompoundUniqueInput'));
  });
});

describe('minimal schema', () => {
  it('handles schema with only generator and datasource without throwing', () => {
    const minimalSchema = `
      generator client {
        provider = "prisma-client-js"
      }
      datasource db {
        provider = "sqlite"
        url      = "file:./dev.db"
      }
    `;
    const ts = generatePothosFromSchema(minimalSchema);
    assert.strictEqual(typeof ts, 'string');
    assert.ok(ts.includes("builder.scalarType('DateTime'"));
  });
});
