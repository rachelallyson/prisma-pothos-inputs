# @rachelallyson/prisma-pothos-inputs

[![npm version](https://img.shields.io/npm/v/@rachelallyson/prisma-pothos-inputs.svg)](https://www.npmjs.com/package/@rachelallyson/prisma-pothos-inputs)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Generate Pothos schema types from your Prisma schema.**  
Scalars, enums, filters, OrderBy, FindManyArgs, Create/Update inputs — with optional Prisma-typed refs so you can pass args straight to the client. Built for **Prisma v7** (works with v5/v6).

---

## What it does

**@rachelallyson/prisma-pothos-inputs** reads your Prisma schema and emits TypeScript that registers types with your [Pothos](https://pothos-graphql.dev/) SchemaBuilder. You get:

- **Scalars** — e.g. `DateTime` (extensible for `JSON`, etc.)
- **Enums** — every Prisma `enum` plus a shared `SortOrder` (`asc` / `desc`)
- **Per-model input types** — `WhereInput`, `WhereUniqueInput` (including compound uniques and compound primary keys `@@id([a, b])`), `OrderByInput` (object shape matching Prisma), `FindManyArgs` (where, orderBy, skip, take), `CreateInput`, `UpdateInput`
- **Relation-style create inputs** (optional) — With `useRelationInputs: true`, create inputs use Prisma-style nested relations: `author: { connect: { id } }`, `create: { ... }`, `connectOrCreate: { where, create }` instead of raw FK fields like `authorId`. Ref types become `Prisma.PostCreateInput` when `prismaClientPath` is set.
- **Filter inputs** — `StringFilter`, `IntFilter`, `DateTimeFilter`, enum filters, list/relation filters so `WhereInput` matches Prisma’s shape

When you pass `--prisma-client-path` (or `prismaClientPath` in the API), the generated refs are typed as `Prisma.UserCreateInput`, `Prisma.PostFindManyArgs`, etc., so resolvers get correct types and you can spread args directly into the Prisma client.

---

## Table of contents

- [Installation](#installation)
- [Quick start](#quick-start)
- [Usage](#usage)
  - [CLI](#cli)
  - [Programmatic API](#programmatic-api)
  - [Generate at server startup](#generate-at-server-startup)
  - [Build integration](#build-integration)
- [What gets generated](#what-gets-generated)
- [Documentation](#documentation)
- [Testing](#testing)
- [License](#license)

---

## Installation

```bash
npm install @rachelallyson/prisma-pothos-inputs
```

**Requirements:** Node.js 18+, a Prisma schema, and [Pothos](https://pothos-graphql.dev/). The package uses [@mrleebo/prisma-ast](https://github.com/MrLeebo/prisma-ast) to parse your schema; no Prisma CLI is required at runtime.

---

## Quick start

1. **Generate Pothos types** (writes a single file that registers scalars, enums, and input types):

```bash
npx @rachelallyson/prisma-pothos-inputs --schema prisma/schema.prisma --output-pothos src/__generated__/pothos-inputs.ts
```

2. **Optional: type refs as Prisma** so resolvers receive `args.data` / `args.input` as the correct Prisma types:

```bash
npx @rachelallyson/prisma-pothos-inputs --schema prisma/schema.prisma --output-pothos src/__generated__/pothos-inputs.ts --prisma-client-path ../../generated/prisma/client.js
```

Use a path **relative to the generated file** so the import resolves.

3. **In your Pothos schema:** call `registerPothosTypes(builder)` and use the returned refs for args (e.g. `refs.UserCreateInputType`, `refs.PostFindManyArgs`). With `prismaClientPath` set, you can pass args straight to Prisma (e.g. `prisma.post.findMany({ ...query, ...(args.input ?? {}) })`).

---

## Usage

### CLI

| Option | Description |
|--------|-------------|
| `--schema <path>` | Path to Prisma schema file. Default: `prisma/schema.prisma`. |
| `--output-pothos <path>` | Write Pothos types (scalars, enums, input types) to this file. |
| `--prisma-client-path <path>` | Path to Prisma client for typed input refs. Use with `--output-pothos`. |
| `--use-relation-inputs` | Use connect/create/connectOrCreate nested inputs instead of FK scalars. Use with `--output-pothos`. |
| `--output-pothos-enums <path>` | Write Pothos enum registration only to this file. |
| `--help`, `-h` | Print usage and exit. |

You must specify at least one of `--output-pothos` or `--output-pothos-enums`.

**Examples:**

```bash
# Full Pothos types
npx @rachelallyson/prisma-pothos-inputs --output-pothos src/__generated__/pothos-inputs.ts

# With Prisma-typed refs
npx @rachelallyson/prisma-pothos-inputs --output-pothos src/__generated__/pothos-inputs.ts --prisma-client-path ../../generated/prisma/client.js

# Enums only
npx @rachelallyson/prisma-pothos-inputs --output-pothos-enums src/__generated__/pothos-enums.ts
```

---

### Programmatic API

**One-shot: schema string → Pothos TypeScript**

```ts
import { generatePothosFromSchema } from '@rachelallyson/prisma-pothos-inputs';
import { readFileSync } from 'fs';

const schemaSource = readFileSync('prisma/schema.prisma', 'utf-8');
const ts = generatePothosFromSchema(schemaSource, {
  prismaClientPath: '../../generated/prisma/client.js', // optional
  useRelationInputs: true, // optional: connect/create/connectOrCreate instead of FK scalars
});
```

**Two-step: parse then generate**

```ts
import { parsePrismaSchema, generatePothosSchema } from '@rachelallyson/prisma-pothos-inputs';

const normalized = parsePrismaSchema(schemaSource);
const ts = generatePothosSchema(normalized, { prismaClientPath: '...' });
```

**Exports:**

- `generatePothosFromSchema(schemaSource, options?)` — Parse + generate in one call.
- **Options** (`GeneratePothosSchemaOptions`): `prismaClientPath?` — path to Prisma client for typed refs; `useRelationInputs?` (default `false`) — when `true`, CreateInput uses nested relation inputs (`connect`, `create`, `connectOrCreate`) and omits FK scalars, and refs are typed as `Prisma.PostCreateInput` etc.
- `writePothosInputs(options)` — **Async.** Read schema from disk, generate, and write the file. Use at server startup so you don’t need a separate generate script (see below).
- `parsePrismaSchema(schemaSource)` — Parse only; returns `NormalizedSchema` (models + enums).
- `generatePothosSchema(normalized, options?)` — Generate from a `NormalizedSchema`.
- `generatePothosEnums(normalized)` — Enum registration only.
- Types: `NormalizedSchema`, `NormalizedModel`, `NormalizedEnum`, `GeneratePothosSchemaOptions`, `WritePothosInputsOptions`, `PothosEnumBuilder`.
- `PRISMA_SCALAR_TO_GRAPHQL`, `CUSTOM_SCALARS` — Mapping and scalar names.

---

### Generate at server startup

Generate the Pothos inputs file when the server starts so you don’t need a separate script. Call `writePothosInputs` **before** importing your schema:

```ts
// server.ts or index.ts — entry point
import { writePothosInputs } from '@rachelallyson/prisma-pothos-inputs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

await writePothosInputs({
  schemaPath: join(__dirname, 'prisma/schema.prisma'),
  outputPath: join(__dirname, 'src/__generated__/pothos-inputs.ts'),
  prismaClientPath: '../../generated/prisma/client.js',
  cwd: join(__dirname, '..'), // optional; defaults to process.cwd()
});

const { schema } = await import('./src/schema.js');
// Start your GraphQL server with schema...
```

Run the entry point with **tsx** (or similar) so the newly written file is loaded when the schema module is imported.

---

### Build integration

Run after Prisma generate:

```json
{
  "scripts": {
    "generate": "prisma generate && npx @rachelallyson/prisma-pothos-inputs --schema prisma/schema.prisma --output-pothos src/__generated__/pothos-inputs.ts --prisma-client-path ../../generated/prisma/client.js"
  }
}
```

See [docs/EXAMPLES.md](docs/EXAMPLES.md) for the full Pothos example.

---

## What gets generated

With `--output-pothos` you get a single file that exports `registerPothosTypes(builder)`. It:

- Registers **scalars** (e.g. `DateTime`).
- Registers **enums**: each Prisma enum (e.g. `Role`) and a shared **SortOrder** (`asc`, `desc`).
- Registers **per-model input types**:
  - **OrderByInput** — one optional `SortOrder` field per sortable column (same shape as Prisma; pass `orderBy: args.orderBy`).
  - **FindManyArgs** — optional `where`, `orderBy`, `skip`, `take` (single input so you can `...(args.input ?? {})`).
  - **WhereInput** / **WhereUniqueInput** — AND/OR/NOT plus scalar and relation filters; compound uniques for `@@unique([a, b])` and compound primary keys `@@id([a, b])`.
  - **CreateInput** / **UpdateInput** — scalar and enum fields (relations via foreign keys where applicable).

When `--prisma-client-path` is set, the return type of `registerPothosTypes` declares refs as `InputTypeRef<..., Prisma.UserCreateInput>`, etc., so Pothos infers correct types in resolvers.

---

## Documentation

**Full docs:** [rachelallyson.github.io/prisma-pothos-inputs](https://rachelallyson.github.io/prisma-pothos-inputs/)

- **Getting started** — Install, first run, wiring into your Pothos schema.
- **API reference** — Programmatic API and options.
- **Examples** — Scripts, direct args, generate at startup.
- **Type mapping** — Prisma → GraphQL mapping.

---

## Testing

```bash
npm test
```

Runs the test suite (Node’s built-in test runner) after building. Tests cover parsing, Pothos schema generation (with and without `prismaClientPath`), and enums.

---

## License

MIT
