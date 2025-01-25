//  Import types
import type { ZodString } from 'zod';
//  Import libs
import { string as zodString } from 'zod';

export const string: ZodString = zodString();
export const nonEmpty: ZodString = string.nonempty({
  message: 'String should not be empty',
});
export const nonEmptyMinLen: (min: number) => ZodString = (
  min: number,
): ZodString => nonEmpty.min(min);
