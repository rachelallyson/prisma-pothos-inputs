# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

