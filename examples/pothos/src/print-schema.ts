/**
 * Print the full GraphQL schema (including all input types) to stdout.
 * Run: npm run build && node dist/src/print-schema.js
 */
import { printSchema } from 'graphql';
import { schema } from './schema.js';

console.log(printSchema(schema));
