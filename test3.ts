import { tool } from 'ai'; import { z } from 'zod'; tool({ description: 'test', parameters: z.object({ query: z.string() }), // @ts-ignore
execute: async ({ query }: { query: string }) => { return query; } });
