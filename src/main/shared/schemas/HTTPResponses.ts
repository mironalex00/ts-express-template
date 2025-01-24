//  Imports
import { z } from 'zod';

// Exports
export const statusSchema = z.object({
    code: z.number().positive().gte(200).lte(503),
    message: z.string().nonempty(),
});
export const apiResponseSchema = z.union([
  z.object({ ok: statusSchema }),
  z.object({ error: statusSchema }),
]);