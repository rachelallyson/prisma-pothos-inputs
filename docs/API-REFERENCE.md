# API reference

This document describes the programmatic API of **@rachelallyson/prisma-pothos-inputs**: exports, types, and options. The package generates **Pothos** TypeScript (scalars, enums, input types) from a Prisma schema and is built for **Prisma v7**. Generated type names (e.g. `UserCreateInput`, `PostUncheckedCreateInput`) match the Prisma client’s `Prisma.*` namespace.

---

## Entry point

```ts
import {
  generatePothosFromSchema,
  parsePrismaSchema,
  generatePothosSchema,
  generatePothosEnums,
  PRISMA_SCALAR_TO_GRAPHQL,
  CUSTOM_SCALARS,
} from '@rachelallyson/prisma-pothos-inputs';
import type {
  NormalizedSchema,
  NormalizedModel,
  NormalizedEnum,
  GeneratePothosSchemaOptions,
} from '@rachelallyson/prisma-pothos-inputs';
```

All paths above are from the main package entry (`@rachelallyson/prisma-pothos-inputs`). The package is ESM-only.

---

## Functions

### `generatePothosFromSchema(schemaSource, options?)`

Parses the Prisma schema string and returns TypeScript source that exports `registerPothosTypes(builder)` for use with Pothos.

- **Parameters**
  - `schemaSource` (`string`): Full contents of a Prisma schema file (e.g. from `readFileSync('prisma/schema.prisma', 'utf-8')`).
  - `options` (`GeneratePothosSchemaOptions`, optional): See [GeneratePothosSchemaOptions](#generatepothosschemaoptions).
- **Returns:** `string` — TypeScript source. Write it to a file (e.g. `src/__generated__/pothos-inputs.ts`) and call `registerPothosTypes(builder)` in your Pothos schema.
- **Throws:** If the schema is invalid. No file I/O is performed.

**Example:**

```ts
const ts = generatePothosFromSchema(schemaSource, {
  prismaClientPath: '../../generated/prisma/client.js',
});
```

---

### `parsePrismaSchema(schemaSource)`

Parses the Prisma schema and returns a normalized representation of models and enums. Does not generate any output.

- **Parameters**
  - `schemaSource` (`string`): Full contents of a Prisma schema file.
- **Returns:** [`NormalizedSchema`](#normalizedschema).
- **Throws:** If the schema is invalid.

**Example:**

```ts
const normalized = parsePrismaSchema(schemaSource);
console.log(normalized.models.map((m) => m.name));
console.log(normalized.enums.map((e) => e.name));
```

---

### `generatePothosSchema(normalized, options?)`

Generates Pothos TypeScript from an already-parsed schema.

- **Parameters**
  - `normalized` (`NormalizedSchema`): Result of `parsePrismaSchema(schemaSource)`.
  - `options` (`GeneratePothosSchemaOptions`, optional): See [GeneratePothosSchemaOptions](#generatepothosschemaoptions).
- **Returns:** `string` — TypeScript source (same as `generatePothosFromSchema`).

**Example:**

```ts
const normalized = parsePrismaSchema(schemaSource);
const ts = generatePothosSchema(normalized, { prismaClientPath: '...' });
```

---

### `generatePothosEnums(normalized)`

Generates TypeScript source that exports a single function, `registerPothosEnums(builder)`. Use it with a Pothos `SchemaBuilder` to register all enums from your Prisma schema and get back a record of enum type refs (e.g. `{ Role: ... }`).

- **Parameters**
  - `normalized` (`NormalizedSchema`): Result of `parsePrismaSchema(schemaSource)`.
- **Returns:** `string` — TypeScript source. Write it to a file (e.g. `src/__generated__/pothos-enums.ts`) and call `registerPothosEnums(builder)` in your Pothos schema.

**Example:**

```ts
import { parsePrismaSchema, generatePothosEnums } from '@rachelallyson/prisma-pothos-inputs';
import { readFileSync, writeFileSync } from 'fs';

const normalized = parsePrismaSchema(readFileSync('prisma/schema.prisma', 'utf-8'));
writeFileSync('src/__generated__/pothos-enums.ts', generatePothosEnums(normalized));
```

CLI: `--output-pothos-enums <path>` writes this file directly.

---

## Constants

### `PRISMA_SCALAR_TO_GRAPHQL`

A `Record<string, string>` mapping Prisma scalar names to GraphQL type names (used in the generated Pothos input fields):

| Key (Prisma) | Value (GraphQL) |
|--------------|------------------|
| `String`     | `String`        |
| `Int`        | `Int`           |
| `Float`      | `Float`         |
| `Boolean`    | `Boolean`       |
| `DateTime`   | `DateTime`      |
| `Json`       | `JSON`          |
| `Bytes`      | `Bytes`         |
| `BigInt`     | `BigInt`        |
| `Decimal`    | `Decimal`       |

Unknown Prisma types are treated as `String` in the generated code.

---

### `CUSTOM_SCALARS`

A readonly array of scalar names that the generator registers with the builder (e.g. `DateTime`). You must implement serialize/parse in your Pothos schema; the generated code only registers them.

---

## Types

### `NormalizedSchema`

```ts
interface NormalizedSchema {
  models: NormalizedModel[];
  enums: NormalizedEnum[];
}
```

Top-level result of parsing: all models (and views/types treated as models) and all enums.

---

### `NormalizedModel`

```ts
interface NormalizedModel {
  name: string;
  fields: ModelField[];
  relationNames: string[];
}
```

- **name:** Model (or view/type) name.
- **fields:** All fields (scalar, enum, relation).
- **relationNames:** List of related model names.

---

### `NormalizedEnum`

```ts
interface NormalizedEnum {
  name: string;
  values: string[];
}
```

Enum name and its enumerator names in order.

---

### `GeneratePothosSchemaOptions`

```ts
interface GeneratePothosSchemaOptions {
  prismaClientPath?: string;
}
```

| Option | Description |
|--------|-------------|
| `prismaClientPath` | Import path to the Prisma client (e.g. `../../generated/prisma/client.js`). When set, the generated file imports `Prisma` and types the returned input refs as `InputTypeRef<any, Prisma.UserCreateInput>`, etc., so you can pass `args.data` directly to Prisma in resolvers. |

---

## Two-step workflow

When you need the normalized data (e.g. to filter models or generate multiple artifacts):

```ts
const normalized = parsePrismaSchema(schemaSource);

const filtered = {
  models: normalized.models.filter((m) => !m.name.startsWith('Internal')),
  enums: normalized.enums,
};

const ts = generatePothosSchema(filtered, { prismaClientPath: '...' });
```
