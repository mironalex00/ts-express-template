//  Import
import { statusSchema } from '@shared/types/http/response';

// 2xx
export const OK = statusSchema.parse({ code: 200, message: 'OK' });
export const CREATED = statusSchema.parse({ code: 201, message: 'Created' });
export const NO_CONTENT = statusSchema.parse({
  code: 204,
  message: 'No Content',
});
// 4xx
export const BAD_REQUEST = statusSchema.parse({
  code: 400,
  message: 'Bad Request',
});
export const UNAUTHORIZED = statusSchema.parse({
  code: 401,
  message: 'Unauthorized',
});
export const FORBIDDEN = statusSchema.parse({
  code: 403,
  message: 'Forbidden',
});
export const NOT_FOUND = statusSchema.parse({
  code: 404,
  message: 'Not Found',
});
export const METHOD_NOT_ALLOWED = statusSchema.parse({
  code: 405,
  message: 'Method Not Allowed',
});
export const CONFLICT = statusSchema.parse({
  code: 409,
  message: 'Conflict',
});
export const UNPROCESSABLE_ENTITY = statusSchema.parse({
  code: 422,
  message: 'Unprocessable Entity',
});
// 5xx
export const INTERNAL_SERVER_ERROR = statusSchema.parse({
  code: 500,
  message: 'Internal Server Error',
});
export const NOT_IMPLEMENTED = statusSchema.parse({
  code: 501,
  message: 'Not Implemented',
});
export const BAD_GATEWAY = statusSchema.parse({
  code: 502,
  message: 'Bad Gateway',
});
export const SERVICE_UNAVAILABLE = statusSchema.parse({
  code: 503,
  message: 'Service Unavailable',
});
