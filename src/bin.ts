#!/usr/bin/env node

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import {
  generatePothosFromSchema,
  parsePrismaSchema,
  generatePothosEnums,
  generatePrismaTypesFromExtendedClient,
} from './index.js';

const help = `
@rachelallyson/prisma-pothos-inputs — Generate Pothos schema types from your Prisma schema (Prisma v7 ready)

Usage:
  @rachelallyson/prisma-pothos-inputs [options] [schema.prisma]

Options:
  --output-pothos <path>        Write Pothos types (scalars, enums, input types) to file
  --prisma-client-path <path>   Path to Prisma client for typed input refs (use with --output-pothos)
  --use-relation-inputs        Use connect/create/connectOrCreate nested inputs instead of FK scalars (use with --output-pothos)
  --output-pothos-enums <path> Write Pothos enum registration only (TypeScript) to file
  --output-prisma-types <path> Write PrismaTypes from extended client (use with --extended-prisma-type-path)
  --extended-prisma-type-path <path> Module that default-exports your extended Prisma client; use with --output-prisma-types so findMany({ ...query, ...args }) type-checks
  --schema <path>              Path to Prisma schema (default: prisma/schema.prisma)
  --help, -h                   Show this help
`;

function main() {
  const args = process.argv.slice(2);
  let schemaPath = 'prisma/schema.prisma';
  let outputPothosPath: string | null = null;
  let prismaClientPath: string | null = null;
  let useRelationInputs = false;
  let outputPothosEnumsPath: string | null = null;
  let outputPrismaTypesPath: string | null = null;
  let extendedPrismaTypePath: string | null = null;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--help':
      case '-h':
        console.log(help.trim());
        process.exit(0);
      case '--output-pothos':
        outputPothosPath = args[++i] ?? null;
        break;
      case '--prisma-client-path':
        prismaClientPath = args[++i] ?? null;
        break;
      case '--use-relation-inputs':
        useRelationInputs = true;
        break;
      case '--output-pothos-enums':
        outputPothosEnumsPath = args[++i] ?? null;
        break;
      case '--output-prisma-types':
        outputPrismaTypesPath = args[++i] ?? null;
        break;
      case '--extended-prisma-type-path':
        extendedPrismaTypePath = args[++i] ?? null;
        break;
      case '--schema':
        schemaPath = args[++i] ?? schemaPath;
        break;
      default:
        if (!args[i]!.startsWith('-')) schemaPath = args[i]!;
    }
  }

  if (!outputPothosPath && !outputPothosEnumsPath && !outputPrismaTypesPath) {
    console.error(
      'Error: Specify at least one of --output-pothos, --output-pothos-enums, or --output-prisma-types.'
    );
    console.error(help.trim());
    process.exit(1);
  }

  if (outputPrismaTypesPath && (!extendedPrismaTypePath || !prismaClientPath)) {
    console.error(
      'Error: --output-prisma-types requires --extended-prisma-type-path and --prisma-client-path.'
    );
    console.error(help.trim());
    process.exit(1);
  }

  const resolvedSchema = resolve(process.cwd(), schemaPath);
  let schemaSource: string;
  try {
    schemaSource = readFileSync(resolvedSchema, 'utf-8');
  } catch (e) {
    console.error(`Error: Could not read schema at ${resolvedSchema}`);
    process.exit(1);
  }

  if (outputPothosPath) {
    const pothosTs = generatePothosFromSchema(schemaSource, {
      ...(prismaClientPath && { prismaClientPath }),
      useRelationInputs,
    });
    const out = resolve(process.cwd(), outputPothosPath);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, pothosTs, 'utf-8');
    console.error(`Wrote ${out}`);
  }

  if (outputPothosEnumsPath) {
    const normalized = parsePrismaSchema(schemaSource);
    const pothosEnumsTs = generatePothosEnums(normalized);
    const out = resolve(process.cwd(), outputPothosEnumsPath);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, pothosEnumsTs, 'utf-8');
    console.error(`Wrote ${out}`);
  }

  if (outputPrismaTypesPath && extendedPrismaTypePath && prismaClientPath) {
    const normalized = parsePrismaSchema(schemaSource);
    const prismaTypesTs = generatePrismaTypesFromExtendedClient(normalized, {
      prismaClientPath,
      extendedPrismaTypePath,
    });
    const out = resolve(process.cwd(), outputPrismaTypesPath);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, prismaTypesTs, 'utf-8');
    console.error(`Wrote ${out}`);
  }
}

main();
