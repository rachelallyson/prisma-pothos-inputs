import {
  getSchema,
  type Schema,
  type Model,
  type Field,
  type Enum,
  type Enumerator,
  type BlockAttribute,
  type RelationArray,
  type Func,
  type AttributeArgument,
  type KeyValue,
} from '@mrleebo/prisma-ast';
import type { NormalizedModel, NormalizedEnum, NormalizedSchema, ModelField, CompoundUnique } from './types.js';
import { PRISMA_SCALAR_TO_GRAPHQL } from './types.js';

function isField(prop: Model['properties'][number]): prop is Field {
  return prop?.type === 'field';
}

function getFieldTypeName(field: Field): string {
  const ft = field.fieldType;
  if (typeof ft === 'string') return ft;
  if (ft?.type === 'function' && ft.name) return ft.name;
  return 'String';
}

function hasAttr(field: Field, name: string): boolean {
  return field.attributes?.some((a) => a.name === name) ?? false;
}

function isRelationField(schema: Schema, modelName: string, fieldType: string): boolean {
  return schema.list.some(
    (b) => (b.type === 'model' || b.type === 'view' || b.type === 'type') && b.name === fieldType
  );
}

/** Get @relation(fields: [x, y]) key field names from a relation field. */
function getRelationKeyFields(field: Field): string[] | undefined {
  const attr = field.attributes?.find((a) => a.name === 'relation');
  if (!attr?.args?.length) return undefined;
  for (const arg of attr.args as AttributeArgument[]) {
    const v = arg?.value;
    if (v && typeof v === 'object' && 'key' in v && (v as KeyValue).key === 'fields') {
      const val = (v as KeyValue).value;
      if (val && typeof val === 'object' && 'args' in val)
        return (val as RelationArray).args?.map((a) => (typeof a === 'string' ? a : String(a)));
    }
  }
  return undefined;
}

function isEnum(schema: Schema, name: string): boolean {
  return schema.list.some((b) => b.type === 'enum' && b.name === name);
}

/** Parse prisma-json-types-generator comment /// [TypeName] or /// ![inline]. Returns TypeName for namespace ref, or undefined. */
function getJsonTypeRefFromComment(comment: string | undefined): string | undefined {
  if (!comment || typeof comment !== 'string') return undefined;
  const trimmed = comment.trim();
  const namespaceMatch = trimmed.match(/\/\/\/\s*\[\s*([^\]\s]+)\s*\]/);
  if (namespaceMatch) return namespaceMatch[1]!;
  return undefined;
}

export function parsePrismaSchema(schemaSource: string): NormalizedSchema {
  const schema = getSchema(schemaSource);
  const enums: NormalizedEnum[] = [];
  const models: NormalizedModel[] = [];

  for (const block of schema.list) {
    if (block.type === 'enum') {
      const values = block.enumerators
        .filter((e): e is Enumerator => e.type === 'enumerator')
        .map((e) => e.name);
      enums.push({ name: block.name, values });
    }

    if (block.type === 'model' || block.type === 'view' || block.type === 'type') {
      const fields: ModelField[] = [];
      const relationNames: string[] = [];
      const compoundUniques: CompoundUnique[] = [];
      let pendingComment: string | undefined;

      for (const prop of block.properties) {
        if (prop?.type === 'comment' && 'text' in prop) {
          pendingComment = (prop as { type: 'comment'; text: string }).text;
          continue;
        }
        if (!isField(prop)) {
          pendingComment = undefined;
          continue;
        }

        const prismaType = getFieldTypeName(prop);
        const isRelation = isRelationField(schema, block.name, prismaType);
        const isEnumType = isEnum(schema, prismaType);

        let kind: ModelField['kind'] = 'scalar';
        let graphqlType: string;

        if (isRelation) {
          kind = 'relation';
          relationNames.push(prismaType);
          graphqlType = prop.array ? `[${prismaType}!]!` : prop.optional ? prismaType : `${prismaType}!`;
        } else if (isEnumType) {
          kind = 'enum';
          graphqlType = prop.array ? `[${prismaType}!]!` : prop.optional ? prismaType : `${prismaType}!`;
        } else {
          const base = PRISMA_SCALAR_TO_GRAPHQL[prismaType] ?? 'String';
          graphqlType = prop.array ? `[${base}!]!` : prop.optional ? base : `${base}!`;
        }

        const jsonTypeRef = getJsonTypeRefFromComment(pendingComment ?? prop.comment);
        pendingComment = undefined;
        fields.push({
          name: prop.name,
          kind,
          graphqlType,
          prismaType,
          optional: prop.optional ?? false,
          isList: prop.array ?? false,
          isId: hasAttr(prop, 'id'),
          isUnique: hasAttr(prop, 'unique'),
          hasDefault: hasAttr(prop, 'default'),
          relationTo: isRelation ? prismaType : undefined,
          relationKeyFields: isRelation ? getRelationKeyFields(prop) : undefined,
          jsonTypeRef: jsonTypeRef ?? undefined,
        });
      }

      // Collect @@unique([a, b, ...]) and @@id([a, b, ...]) as compound uniques (Prisma key: a_b_c, type: ModelNameAbcCompoundUniqueInput)
      for (const prop of block.properties) {
        const attr = prop as BlockAttribute;
        if (attr?.type !== 'attribute') continue;
        if (attr.name !== 'unique' && attr.name !== 'id') continue;
        const args = attr.args ?? [];
        let fieldNames: string[] = [];
        for (const arg of args) {
          const val = arg?.value;
          if (val && typeof val === 'object') {
            if ('args' in val && Array.isArray((val as RelationArray).args)) {
              const arr = (val as RelationArray).args;
              fieldNames = arr.map((a) => (typeof a === 'string' ? a : String(a)));
              break;
            }
            if ('params' in val && Array.isArray((val as Func).params)) {
              const par = (val as Func).params ?? [];
              fieldNames = par.map((p) => (typeof p === 'string' ? p : String(p)));
              break;
            }
          }
        }
        if (fieldNames.length >= 2) {
          compoundUniques.push({ key: fieldNames.join('_'), fields: fieldNames });
        }
      }

      models.push({ name: block.name, fields, relationNames, compoundUniques });
    }
  }

  // Populate relationBackField: for each relation field M.f -> R, find R's field that points to M
  for (const model of models) {
    for (const field of model.fields) {
      if (field.relationTo == null) continue;
      const relatedModel = models.find((m) => m.name === field.relationTo);
      if (!relatedModel) continue;
      const backField = relatedModel.fields.find(
        (f) => f.relationTo === model.name || (f.kind === 'relation' && f.prismaType === model.name)
      );
      if (backField) (field as ModelField).relationBackField = backField.name;
    }
  }

  return { models, enums };
}
