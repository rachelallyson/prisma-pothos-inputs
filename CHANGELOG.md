# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.1] - 2026-03-03

### Fixed

- **CreateNestedOne Prisma typing when current relation is list** — The generator only adds `CreateNestedOneWithoutX` to the Prisma-typed return when the **current** relation is single (`!f.isList`). When the current model has a list relation (one-to-many one side or many-to-many), Prisma only generates `CreateNestedManyWithoutX`; the generator no longer asserts `Prisma.XCreateNestedOneWithoutYInput` for those refs, so you can drop post-generate patches that swap those refs to `*Many*` (fixes TS2724 for Report, PeopleTag, PeopleGroup, PersonInterval, PeopleInterval, PeopleDepartment, QuestionTag, LibraryQuestion and similar).

## [1.4.0] - 2026-03-03

### Added

- **PrismaTypes from extended client** — When you use Prisma client extensions (`$extends`), the plugin’s `query` type can disagree with the extended client and cause “Excessive stack depth” or type errors on `findMany({ ...query, ...args.input })`. You can now generate PrismaTypes from your extended client so the plugin types `query` with the same types and the spread type-checks with no assertion.
  - **CLI:** `--output-prisma-types <path>` and `--extended-prisma-type-path <path>` (requires `--prisma-client-path`). The module at the extended path must export `export type ExtendedPrisma = typeof yourExtendedClient;`
  - **API:** `generatePrismaTypesFromExtendedClient(normalized, { prismaClientPath, extendedPrismaTypePath })` and type `GeneratePrismaTypesFromExtendedOptions`. Use the generated file as your SchemaBuilder’s `PrismaTypes` and pass the same extended client in context.
- **Example** — `examples/pothos`: `db-extended.ts`, `schema-extended.ts`, `npm run generate:prisma-types-extended`, and `npm run verify:extended` demonstrate the extended-client flow and confirm it type-checks.

## [1.3.4] - 2026-03-03

### Fixed

- **Self-relation back field** — For self-relations (e.g. `PeopleDepartment` with `parent` / `children`), the parser now chooses the other side as `relationBackField` instead of the first matching field, so `parent` gets back field `children` and vice versa. This fixes incorrect Prisma-typed refs (e.g. `PeopleDepartmentCreateNestedOneWithoutParentInput`) when only `CreateNestedMany` exists; the generator no longer asserts those types and the patch is no longer needed.

## [1.3.3] - 2026-03-03

### Fixed

- **CreateNestedOne when current relation is list** — CreateNestedOne refs are only added to the Prisma-typed return when the relation is single on the current model (`!f.isList`). When the current model has a list relation (e.g. `Church.teams`), Prisma only generates `CreateNestedManyWithoutX`; the generator no longer asserts `Prisma.XCreateNestedOneWithoutYInput` for those refs and uses the generic input ref type instead (fixes remaining TS2724 for Team, Church, Dashboard, etc.).

## [1.3.2] - 2026-03-03

### Fixed

- **UpdateOne vs UpdateOneRequired typing** — A nested input ref is only added to the Prisma-typed return when it matches the relation’s optionality: `UpdateOneWithoutX` only when the relation is optional (`f.optional === true`), and `UpdateOneRequiredWithoutX` only when the relation is required (`f.optional === false`). Prisma does not generate the other variant for that side, so this avoids TS2724.
- **CreateNestedOne on the “many” side** — `CreateNestedOneWithoutX` is only added to the Prisma-typed return when the back relation (on the related model) is single; for one-to-many the “one” side only has `CreateNestedManyWithoutX` in Prisma, so the generator now uses the generic input ref type for that ref instead of asserting `Prisma.X`.

## [1.3.1] - 2026-03-03

### Fixed

- **Nested input types and Prisma cardinality** — The generator no longer emits or types nested input refs that Prisma does not generate. UpdateOne/UpdateOneRequired are only emitted for single relations (`!f.isList`); for list (many-to-many) relations only UpdateMany variants are emitted. CreateNestedOne is only added to the Prisma-typed return map when the relation is single; list-relation CreateNestedOne refs remain exported but use the generic input ref return type so `InputTypeRef<..., Prisma.X>` is never asserted for non-existent Prisma types (fixes TS2724).

## [1.3.0] - 2026-03-03

### Added

- **omitPrismaObjectFields** — Option for `generatePothosSchema` / `writePothosInputs`. When `includePrismaObjects` is true, pass `omitPrismaObjectFields: { ModelName: ['field1', 'field2'] }` to omit those field names from the generated `builder.prismaObject(ModelName, ...)` so you can override them elsewhere (e.g. with union types) without Pothos reporting duplicate fields.
- **Export all nested input types** — When `useRelationInputs` is true, every nested relation input type (CreateWithoutX, CreateNestedOneWithoutX, CreateNestedManyWithoutX, CreateOrConnectWithoutX, UpdateWithoutX, UpdateOneWithoutX, UpdateOneRequiredWithoutX, UpdateManyWithoutXNestedInput, UpdateWithWhereUniqueWithoutX, UpdateManyWithWhereWithoutX) is now emitted as a named const and included in the register function’s return object, so consumers can reference any of them (e.g. `pothosInputRefs.MetricCreateNestedOneWithoutEntriesInputType`) without config or patches.

### Changed

- **Prisma object nullability for fields with defaults** — When building prismaObject scalar/enum fields, output nullability now reflects “can this field be null in the DB?”: optional fields with `@default(...)` are emitted as non-null (`nullable: false`) because they always have a value at read time. Optional fields without a default remain nullable.

## [1.2.0] - 2026-02-09

### Added

- **Optional Prisma JSON types** — `usePrismaJsonTypes` option. When `true`, `Json` fields with a `/// [TypeName]` comment (e.g. from prisma-json-types-generator) expose that type name in prismaObject instead of `JSON`. You must register the Pothos type yourself; the generator only references it by name.
- **Regression test suite** — Dedicated tests for previously fixed bugs: non-null `id` and required enum fields in prismaObject, `onNull: 'error'` and explicit `nullable` on relations, `DateTimeNullableFilter` for optional DateTime, list relation `where`/`query` for nested filters, list relations as non-null arrays.

### Changed

- **Prisma object nullability** — All output fields now set `nullable` explicitly (Pothos v4 defaults to nullable). Required scalars, enums, and `id` use `nullable: false` so client types get `id: string` and `role: Role` instead of `id?: string | null`. Optional fields use `nullable: true`.
- **List relations** — Emit `nullable: false` so the list is non-null; client types get `posts: Array<...>` instead of `posts?: Array<...> | null`.
- **Single relations** — Emit explicit `nullable: true` or `nullable: false` from the Prisma schema (optional vs required relation). All relations use `onNull: 'error'` for plugin compatibility.
- **BatchPayload** — `count` field now has `nullable: false`.

### Documentation

- **Optional Prisma JSON types** — New doc `prisma-json-types.mdx`: how to use `usePrismaJsonTypes` and `/// [TypeName]`, that the generator only references type names and does not build object types.
- **Type mapping** — List relation nullability and args; `DateTimeNullableFilter` for optional DateTime; nullability rules and link to prisma-json-types.
- **Examples** — includePrismaObjects and explicit nullability in manual wiring example; cross-links updated.

## [1.1.0] - 2026-02-09

### Added

- **Prisma object builder** — `includePrismaObjects` option for `generatePothosSchema` / `generatePothosFromSchema`. When `true`, generated code registers `builder.prismaObject(modelName, { fields })` for each Prisma model (scalars/enums as `t.expose*`, relations as `t.relation`), so you don’t have to wire object types by hand. Requires `@pothos/plugin-prisma`.

### Changed

- **List relations** — Get `where`, `orderBy`, `take`, and `skip` args and a `query` that passes them through so nested `where` (e.g. `subDepartments(where: { deletedAt: { equals: null } })`) works.
- **Optional DateTime in filters** — Optional `DateTime?` fields use `DateTimeNullableFilter` (with `equals: null` support) so nested `where: { deletedAt: { equals: null } }` is valid.
- **Relations** — Use `onNull: 'error'` for plugin compatibility.

## [1.0.0] - 2026-02-09

### Added

- **CLI** — `prisma-pothos-inputs` / `npx @rachelallyson/prisma-pothos-inputs` with `--schema`, `--output-pothos`, `--output-pothos-enums`, and `--prisma-client-path`.
- **Programmatic API** — `generatePothosFromSchema(schemaSource, options)`, `writePothosInputs(options)` (async, for generate-at-startup), `parsePrismaSchema`, `generatePothosSchema`, `generatePothosEnums`.
- **Generated Pothos types** from Prisma schema:
  - Scalars: `DateTime` (extensible for `JSON` and others).
  - Enums: every Prisma enum plus shared `SortOrder` (`asc` / `desc`).
  - Per-model input types: `WhereInput`, `WhereUniqueInput` (including compound uniques and compound primary keys `@@id([a, b])`), `OrderByInput`, `FindManyArgs`, `CreateInput`, `UpdateInput`.
  - Filter inputs: `StringFilter`, `IntFilter`, `DateTimeFilter`, enum filters, list/relation filters.
- **Optional Prisma-typed refs** — when `prismaClientPath` is set, generated refs use Prisma types (e.g. `Prisma.UserCreateInput`, `Prisma.PostFindManyArgs`) so resolvers stay type-safe and args can be passed straight to the client.
- **Enums-only output** — `--output-pothos-enums` to emit only enum registration (e.g. for separate enum file).
- Support for **Prisma v5, v6, and v7** (schema parsed via `@mrleebo/prisma-ast`; no Prisma CLI required at runtime).
