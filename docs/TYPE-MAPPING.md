# Type mapping

The package generates **Pothos TypeScript** (scalars, enums, CreateInput, UpdateInput, OrderBy enums), not SDL. This document describes how Prisma types map to GraphQL in that output. The naming follows **Prisma v7**’s generated client types so your GraphQL schema stays aligned with `Prisma.UserCreateInput`, Prisma client types (`Prisma.UserCreateInput`, etc.). The generator does not emit WhereInput or filter inputs.

---

## Scalar mapping

| Prisma type | GraphQL type | Built-in? | Notes |
|-------------|--------------|-----------|--------|
| `String`    | `String`     | Yes       | |
| `Int`       | `Int`        | Yes       | |
| `Float`     | `Float`      | Yes       | |
| `Boolean`   | `Boolean`    | Yes       | |
| `DateTime`  | `DateTime`   | No        | Custom scalar; you implement. |
| `Json`      | `JSON`       | No        | Custom scalar. |
| `Bytes`     | `Bytes`      | No        | Custom scalar. |
| `BigInt`    | `BigInt`     | No        | Custom scalar. |
| `Decimal`   | `Decimal`    | No        | Custom scalar. |

Any Prisma field type that is not a known scalar or enum and not another model name is treated as **String** in the generated SDL.

---

## Nullability and lists

- **Optional field** (`String?`) → GraphQL type without `!` (nullable), e.g. `String`.
- **Required field** (`String`) → GraphQL type with `!`, e.g. `String!`.
- **List** (`String[]`, `String[]?`) → GraphQL list, e.g. `[String!]!` or `[String!]!` (list itself is non-null; element type is non-null).
- **Optional relation** (`User?`) → nullable object type, e.g. `User` (no trailing `!`).

---

## Enums

Each Prisma `enum` becomes a GraphQL `enum` with the same name and the same value names:

```prisma
enum Role {
  USER
  ADMIN
}
```

```graphql
enum Role {
  USER
  ADMIN
}
```

When `filterInputs: true`, for each enum you also get:

- **`<Enum>Filter`** — for filtering a single enum field (`equals`, `in`, `notIn`, `not`).
- **`<Enum>ListFilter`** — for filtering a list-of-enum field (`equals`, `has`, `hasEvery`, `hasSome`, `isEmpty`).

---

## Object types (output)

For each model (and view/type), one GraphQL **output type** is generated:

```graphql
type User {
  id:        String!
  email:     String!
  name:      String
  role:      Role!
  createdAt: DateTime!
  posts:     [Post!]!
}
```

- Scalar and enum fields use the mappings above.
- Relation fields reference the related model type; list relations are `[Model!]!`, optional relations are `Model` (nullable).
- If `includeRelations: false`, relation fields are omitted.

---

## CreateInput and UpdateInput (simple mode)

With `simpleInputs: true` (default):

- **CreateInput** includes every scalar and enum field. The `id` field is emitted as optional (so you can omit it for auto-generated ids). Other required fields are required in the input.
- **UpdateInput** includes the same scalar/enum fields, all as optional (nullable), so you can patch a subset of fields.

Nested relation inputs (e.g. `connect`, `create` for relations) are **not** generated. For full Prisma-style nested creates/updates you would need to either add those input types yourself or use a different generator.

**Example (User):**

```graphql
input UserCreateInput {
  id:        String
  email:     String!
  name:      String
  role:      Role!
  createdAt: DateTime
}

input UserUpdateInput {
  id:        String
  email:     String
  name:      String
  role:      Role
  createdAt: DateTime
}
```

---

## WhereInput

Each model gets a **WhereInput** used for filtering in queries:

```graphql
input UserWhereInput {
  AND:   [UserWhereInput!]
  OR:    [UserWhereInput!]
  NOT:   UserWhereInput
  id:    StringFilter
  email: StringFilter
  name:  StringFilter
  role:   RoleFilter
  createdAt: DateTimeFilter
}
```

- **AND / OR / NOT** allow combining conditions.
- Each scalar/enum field gets a corresponding `*Filter` input (see below).
- List fields get a `*ListFilter` input.
- Relation fields are **not** included in WhereInput (only scalar/enum/list).

---

## WhereUniqueInput

Only fields that are `@id` or `@unique` appear:

```graphql
input UserWhereUniqueInput {
  id:    String!
  email: String!
}
```

Used for lookups by primary key or unique constraint.

---

## OrderByInput

For each model, an enum of sort options is generated:

```graphql
enum UserOrderByInput {
  id_ASC
  id_DESC
  email_ASC
  email_DESC
  name_ASC
  name_DESC
  role_ASC
  role_DESC
  createdAt_ASC
  createdAt_DESC
}
```

Only scalar and enum fields are included (no relation fields).

---

## Generic filter inputs (when `filterInputs: true`)

These are emitted once and reused by every model’s WhereInput.

### Scalar filters

**StringFilter:**

```graphql
input StringFilter {
  equals:     String
  in:        [String!]
  notIn:     [String!]
  contains:  String
  startsWith: String
  endsWith:  String
  not:       StringFilter
}
```

**IntFilter / FloatFilter / BigIntFilter / DecimalFilter:**  
`equals`, `in`, `notIn`, `lt`, `lte`, `gt`, `gte`, `not`.

**BooleanFilter:**  
`equals`, `not`.

**DateTimeFilter:**  
Same as numeric: `equals`, `in`, `notIn`, `lt`, `lte`, `gt`, `gte`, `not`.

**JSONFilter:**  
`equals`, `not`.

**BytesFilter:**  
`equals`, `not`.

### Enum filter

For each enum (e.g. `Role`):

```graphql
input RoleFilter {
  equals: Role
  in:     [Role!]
  notIn:  [Role!]
  not:   RoleFilter
}
```

### List filters

For scalar lists and enum lists:

**StringListFilter (and IntListFilter, FloatListFilter, BooleanListFilter):**

```graphql
input StringListFilter {
  equals:   [String!]
  has:      String
  hasEvery: [String!]
  hasSome:  [String!]
  isEmpty:  Boolean
}
```

**`<Enum>ListFilter`** has the same shape with the enum type in place of `String`.

---

## Custom scalars (declaration only)

When `scalars: true`, the SDL starts with:

```graphql
# Custom scalars (map to your runtime)
scalar DateTime
scalar JSON
scalar Bytes
scalar BigInt
scalar Decimal
```

The package does **not** implement these. You must register them in your GraphQL server (serialize/parse and optionally validation). If you already declare these scalars elsewhere, use `scalars: false` or `--no-scalars` to avoid duplicate declarations.

---

## Order of emitted definitions

Rough order in the generated SDL:

1. Custom scalar declarations (if `scalars: true`).
2. Enum definitions (all enums).
3. Generic filter inputs (if `filterInputs: true`): scalar filters, list filters, then one `<Enum>Filter` and `<Enum>ListFilter` per enum.
4. Object types (all models).
5. Per model: CreateInput, UpdateInput, WhereInput, WhereUniqueInput, OrderByInput.

This order is chosen so that types are defined before they are referenced.
