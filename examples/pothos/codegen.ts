import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: '../schema.generated.graphql',
  generates: {
    'src/__generated__/graphql.ts': {
      plugins: ['typescript'],
      config: {
        scalars: {
          DateTime: 'Date',
          JSON: 'unknown',
          Bytes: 'Buffer',
          BigInt: 'bigint',
          Decimal: 'object',
        },
        enumsAsTypes: true,
      },
    },
  },
};

export default config;
