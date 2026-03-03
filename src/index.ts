/**
 * @rachelallyson/prisma-pothos-inputs
 *
 * Generates Pothos schema types (scalars, enums, WhereInput, OrderBy, FindManyArgs, Create/Update inputs)
 * from a Prisma schema. Optionally types refs as Prisma.* so you can pass args straight to the client.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { parsePrismaSchema } from './parse.js';
import { generatePothosSchema } from './pothos-schema.js';
import type {
  GeneratePothosSchemaOptions,
  GeneratePrismaTypesFromExtendedOptions,
} from './pothos-schema.js';
import type { NormalizedSchema, NormalizedModel, NormalizedEnum } from './types.js';

export type { NormalizedSchema, NormalizedModel, NormalizedEnum };
export type { PothosEnumBuilder } from './pothos-enums.js';
export type {
  GeneratePothosSchemaOptions,
  GeneratePrismaTypesFromExtendedOptions,
} from './pothos-schema.js';
export { parsePrismaSchema } from './parse.js';
export { generatePothosEnums } from './pothos-enums.js';
export { generatePothosSchema, generatePrismaTypesFromExtendedClient } from './pothos-schema.js';
export { PRISMA_SCALAR_TO_GRAPHQL, CUSTOM_SCALARS } from './types.js';

/**
 * Generate Pothos TypeScript (scalars, enums, input types) from Prisma schema source.
 * When options.prismaClientPath is set, input refs are typed as Prisma create/update inputs so you can pass args directly to Prisma.
 */
export function generatePothosFromSchema(
  schemaSource: string,
  options?: GeneratePothosSchemaOptions
): string {
  const normalized = parsePrismaSchema(schemaSource);
  return generatePothosSchema(normalized, options ?? {});
}

/** Options for writePothosInputs (generate at server startup). */
export interface WritePothosInputsOptions extends GeneratePothosSchemaOptions {
  /** Path to Prisma schema file (e.g. "prisma/schema.prisma"). */
  schemaPath: string;
  /** Path to write the generated Pothos inputs file (e.g. "src/__generated__/pothos-inputs.ts"). */
  outputPath: string;
  /** Working directory for resolving schemaPath and outputPath. Defaults to process.cwd(). */
  cwd?: string;
}

/**
 * Read the Prisma schema from disk, generate Pothos inputs, and write to the output file.
 * Call this at server startup (e.g. before building the Pothos schema) so you don't need a separate generate script.
 *
 * @example
 * ```ts
 * import { writePothosInputs } from '@rachelallyson/prisma-pothos-inputs';
 *
 * await writePothosInputs({
 *   schemaPath: 'prisma/schema.prisma',
 *   outputPath: 'src/__generated__/pothos-inputs.ts',
 *   prismaClientPath: '../../generated/prisma/client.js',
 * });
 * ```
 */
export async function writePothosInputs(options: WritePothosInputsOptions): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  const schemaPath = resolve(cwd, options.schemaPath);
  const outputPath = resolve(cwd, options.outputPath);

  const schemaSource = await readFile(schemaPath, 'utf-8');
  const { schemaPath: _s, outputPath: _o, cwd: _c, ...generateOptions } = options;
  const code = generatePothosFromSchema(schemaSource, generateOptions);

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, code, 'utf-8');
}
