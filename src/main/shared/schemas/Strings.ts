// Import lib
import { z } from 'zod';

// Import Local
import { apiResponseSchema } from '@shared-schemas/HTTPResponses';
import { statusSchema } from '@shared-schemas/HTTPResponses';

export const appStrSchema = z.object({
  errors: z.object({
    api: z.object({
      notFound: statusSchema,
      internalServerError: statusSchema,
    }),
    app: z.object({
      validationSchema: z
        .object({
          httpResponseSchema: statusSchema,
        })
        .optional(),
    }),
  }),
  auth: z.object({
    api: z.object({
      signin: apiResponseSchema,
      signup: apiResponseSchema,
    }),
  }),
});
