//  Imports lib
import { object, union } from 'zod';

//  Imports local
import { positiveInt } from '@shared-types/zod/numbers';
import { nonEmpty } from '@shared-types/zod/strings';

// Exports
export const statusSchema = object({
  code: positiveInt.gte(200).lte(503),
  message: nonEmpty,
});
export const apiResponseSchema = union([
  object({ ok: statusSchema }),
  object({ error: statusSchema }),
]);
