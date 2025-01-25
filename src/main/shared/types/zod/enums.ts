//  Import libs
import { literal, union } from 'zod';

//  Types
type StringValue = string | string[];
type NumberValue = number | number[];
type BooleanValue = boolean | boolean[];

//  Export types
export type EnumValues = StringValue | NumberValue | BooleanValue;

/* 
  From array, allows EnumValues type, example: arrayEnum(['one', 2, false])
*/
export const arrayEnum = (values: [EnumValues, ...Array<EnumValues>]) => {
  const literals = values.map((value) => {
    switch (typeof value) {
      case 'string':
        return literal(value);
      case 'number':
        return literal(value);
      case 'boolean':
        return literal(value);
      default:
        throw new Error(`Unsupported type: ${typeof value}`);
    }
  });
  return union(
    literals as [
      (typeof literals)[0],
      (typeof literals)[0],
      ...typeof literals,
    ],
  );
};

/*
    From enum, allows EnumValues type, example:
    enum MyEnum { STR: 'Hello World', NUM: 2, BOOL: false }
    arrayEnum(MyEnum)
*/
export const literalEnum = <
  T extends Record<string, string | number | boolean>,
>(
  enumObj: T,
) => {
  const enumValues = Object.values(enumObj).filter((value) => {
    return (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    );
  });
  if (enumValues.length < 2) {
    throw new Error('The enum must have at least two unique values.');
  }
  return arrayEnum(
    enumValues as [
      string | number | boolean,
      ...Array<string | number | boolean>,
    ],
  );
};
