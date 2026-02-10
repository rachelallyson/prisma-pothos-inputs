/**
 * Prisma → GraphQL type mapping.
 * Aligns with Prisma v7 generated client type names (UserCreateInput, UserWhereInput, etc.).
 */

export const PRISMA_SCALAR_TO_GRAPHQL: Record<string, string> = {
  String: 'String',
  Int: 'Int',
  Float: 'Float',
  Boolean: 'Boolean',
  DateTime: 'DateTime',
  Json: 'JSON',
  Bytes: 'Bytes',
  BigInt: 'BigInt',
  Decimal: 'Decimal',
};

/** GraphQL scalar names that need to be declared in the schema (custom scalars). */
export const CUSTOM_SCALARS = ['DateTime', 'JSON', 'Bytes', 'BigInt', 'Decimal'] as const;

export type CustomScalar = (typeof CUSTOM_SCALARS)[number];

/** Normalized model field from Prisma schema. */
export interface ModelField {
  name: string;
  kind: 'scalar' | 'enum' | 'relation';
  /** GraphQL type string (e.g. 'String', 'Int', 'User', '[User!]!') */
  graphqlType: string;
  /** Prisma type name (e.g. 'String', 'UserRole', 'User') */
  prismaType: string;
  optional: boolean;
  isList: boolean;
  isId?: boolean;
  isUnique?: boolean;
  /** True if the field has @default(...) in Prisma (optional in CreateInput). */
  hasDefault?: boolean;
  /** For relations: the other model name */
  relationTo?: string;
  /** For relations: the field name on the related model that points back (e.g. Post.author -> User.posts => 'posts'). Used for Prisma nested input names (WithoutPosts, etc.). */
  relationBackField?: string;
  /** For relations: scalar FK field names from @relation(fields: [authorId], ...) so we can omit them when emitting relation-style CreateInput. */
  relationKeyFields?: string[];
  /** When set, this Json (or String) field is typed via prisma-json-types-generator; use this name as the Pothos type when usePrismaJsonTypes is on. From schema comment /// [TypeName]. */
  jsonTypeRef?: string;
}

/** Compound unique constraint (e.g. @@unique([id, email]) -> key "id_email", fields ["id","email"]). */
export interface CompoundUnique {
  /** Prisma-style key for WhereUniqueInput (e.g. "id_email"). */
  key: string;
  /** Field names in order. */
  fields: string[];
}

/** Normalized model for codegen. */
export interface NormalizedModel {
  name: string;
  fields: ModelField[];
  /** Model names this model has relations to (for connect/create inputs). */
  relationNames: string[];
  /** Compound unique constraints from @@unique([...]). */
  compoundUniques: CompoundUnique[];
}

/** Normalized enum for codegen. */
export interface NormalizedEnum {
  name: string;
  values: string[];
}

export interface NormalizedSchema {
  models: NormalizedModel[];
  enums: NormalizedEnum[];
}
