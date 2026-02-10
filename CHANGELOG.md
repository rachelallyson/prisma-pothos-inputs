# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
