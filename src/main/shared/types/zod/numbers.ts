//  Import types
import type { ZodBigInt, ZodNumber } from 'zod';
//  Import libs
import { bigint as zodBigInt, number as zodNumber } from 'zod';

export const bigint: ZodBigInt = zodBigInt();
export const number: ZodNumber = zodNumber();

export const double: ZodNumber = number;
export const positiveDouble: ZodNumber = double.positive({
  message: 'Number must be positive',
});
export const negativeDouble: ZodNumber = double.negative({
  message: 'Number must be negative',
});

export const integer: ZodNumber = number.int({ message: 'Provide int value' });
export const positiveInt: ZodNumber = double.positive({
  message: 'Int must be positive',
});
export const negativeInt: ZodNumber = double.negative({
  message: 'Int must be negative',
});
