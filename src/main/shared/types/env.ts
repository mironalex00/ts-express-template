//  Imports local
import { join } from 'node:path';
import { nonEmpty, nonEmptyMinLen, string } from '@shared-types/zod/strings';
import { arrayEnum } from '@shared-types/zod/enums';

//  Imports libs
import { object } from 'zod';

//  Exports
export const envSchema = object({
  APP_NAME: nonEmptyMinLen(1).default('Generic API'),
  APP_LANG: arrayEnum(['en_EN', 'en_GB', 'es_ES']).default('es_ES'),
  PORT: nonEmpty
    .refine((val) => !isNaN(parseInt(val)), {
      message: 'PORT must be a numeric-value string',
    })
    .default('8080'),
  NODE_ENV: arrayEnum(['DEV', 'PROD', 'TEST']).default('PROD'),
  LOGGER_LEVEL: arrayEnum(['error', 'warn', 'info']).default('info'),
  LOGGER_PATH: string.default(join(process.cwd(), '.logs')),
});
