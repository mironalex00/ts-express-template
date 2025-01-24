import { Request, Response, NextFunction } from 'express';
import { HTTPError } from '@shared/Errors';
import { NOT_IMPLEMENTED } from '@shared/StatusCodes';
import { logger } from '@shared/Setup';

export default async (
  err: Error|HTTPError,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
    if(err && err instanceof HTTPError) {
      logger.error(err.message);
      res.status(err.code).json({ message: err.message });
      return;
    }
    res.status(NOT_IMPLEMENTED.code).json({ message: NOT_IMPLEMENTED.message });
};