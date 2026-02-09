/**
 * Example: generate Pothos inputs at server startup so you don't need a separate generate script.
 * Run with: npx tsx src/server.ts
 * (tsx loads the newly written pothos-inputs.ts when schema is imported.)
 */
import { writePothosInputs } from '@rachelallyson/prisma-pothos-inputs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

await writePothosInputs({
  schemaPath: join(projectRoot, 'prisma/schema.prisma'),
  outputPath: join(projectRoot, 'src/__generated__/pothos-inputs.ts'),
  prismaClientPath: '../../generated/prisma/client.js',
  useRelationInputs: true,
  cwd: projectRoot,
});

const { schema } = await import('./schema.js');
const { printSchema } = await import('graphql');
console.log(printSchema(schema));
