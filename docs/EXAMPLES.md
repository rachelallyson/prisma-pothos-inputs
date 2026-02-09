# Examples

This page shows how to use **@rachelallyson/prisma-pothos-inputs** with Pothos and Prisma.

---

## Generate script in package.json

Run the CLI after Prisma generate so Pothos types stay in sync with your schema:

```json
{
  "scripts": {
    "generate": "prisma generate && npx @rachelallyson/prisma-pothos-inputs --schema prisma/schema.prisma --output-pothos src/__generated__/pothos-inputs.ts --prisma-client-path ../../generated/prisma/client.js"
  }
}
```

Use `--prisma-client-path` with a path **relative to the generated file** so the Prisma import resolves. Then run `npm run generate`.

---

## Programmatic generation

Generate Pothos TypeScript from a schema and write it to disk:

```ts
// scripts/generate-pothos.ts
import { generatePothosFromSchema } from '@rachelallyson/prisma-pothos-inputs';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';

const schemaPath = join(process.cwd(), 'prisma', 'schema.prisma');
const outPath = join(process.cwd(), 'src', '__generated__', 'pothos-inputs.ts');

const schemaSource = readFileSync(schemaPath, 'utf-8');
const ts = generatePothosFromSchema(schemaSource, {
  prismaClientPath: '../../generated/prisma/client.js',
});

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, ts, 'utf-8');
console.log('Wrote', outPath);
```

Run with `tsx scripts/generate-pothos.ts` or compile and run with Node.

---

## Pothos + Prisma: full flow

1. **Generate Pothos types** (scalars, enums, create/update inputs):

```bash
npx @rachelallyson/prisma-pothos-inputs --schema prisma/schema.prisma --output-pothos src/__generated__/pothos-inputs.ts --prisma-client-path ../../generated/prisma/client.js
```

1. **In your Pothos schema**, call `registerPothosTypes(builder)` and use the returned refs for mutation args:

```ts
import { registerPothosTypes } from './__generated__/pothos-inputs.js';

const refs = registerPothosTypes(builder);

builder.mutationType({
  fields: (t) => ({
    createUser: t.prismaField({
      type: 'User',
      args: {
        data: t.arg({ type: refs.UserCreateInputType, required: true }),
      },
      resolve: async (_query, _root, args) =>
        prisma.user.create({ data: args.data }),
    }),
  }),
});
```

Because you passed `--prisma-client-path`, `refs.UserCreateInputType` is typed as `InputTypeRef<any, Prisma.UserCreateInput>`, so `args.data` is inferred as `Prisma.UserCreateInput` and you can pass it directly to `prisma.user.create({ data: args.data })`.

1. **Optional: GraphQL Code Generator** — Point codegen at your Pothos schema (e.g. by introspecting the server or by building the schema and using `printSchema(schema)`) to get TypeScript types for client queries and mutations.

---

## Enums only

If you only want enum registration (e.g. you define input types yourself):

```bash
npx @rachelallyson/prisma-pothos-inputs --schema prisma/schema.prisma --output-pothos-enums src/__generated__/pothos-enums.ts
```

```ts
import { registerPothosEnums } from './__generated__/pothos-enums.js';

const enums = registerPothosEnums(builder);
const Role = enums.Role; // use in t.expose('role', { type: Role }), etc.
```

---

## Filtering generated models

To generate types only for a subset of models (e.g. exclude internal or legacy models), use the two-step API and filter before calling `generatePothosSchema`:

```ts
import { parsePrismaSchema, generatePothosSchema } from '@rachelallyson/prisma-pothos-inputs';
import { readFileSync, writeFileSync } from 'fs';

const schemaSource = readFileSync('prisma/schema.prisma', 'utf-8');
const normalized = parsePrismaSchema(schemaSource);

const publicModels = normalized.models.filter(
  (m) => !m.name.startsWith('Internal') && m.name !== 'AuditLog'
);

const ts = generatePothosSchema(
  { models: publicModels, enums: normalized.enums },
  { prismaClientPath: '../../generated/prisma/client.js' }
);

writeFileSync('src/__generated__/pothos-inputs.ts', ts);
```

You can filter enums the same way if needed.
