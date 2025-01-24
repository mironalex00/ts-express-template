//  Imports
import { join } from 'node:path';
import { z } from 'zod';

//  Exports
export const envSchema = z.object({
    APP_NAME: z.string().nonempty().default('Generic API'),
    APP_LANG: z.enum(['en_EN', 'en_GB', 'es_ES']).default('es_ES'),
    PORT: z
    .string()
    .refine((val) => !isNaN(parseInt(val)), {
        message: 'PORT must be a numeric-value string',
    })
    .default('8080'),
    NODE_ENV: z.enum(['DEV', 'PROD', 'TEST']).default('PROD'),
    LOGGER_LEVEL: z.enum(['error', 'warn', 'info']).default('info'),
    LOGGER_PATH: z.string().default(join(process.cwd(), '.logs')),
});