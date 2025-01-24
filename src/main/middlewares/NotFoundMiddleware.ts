import { Request, Response, NextFunction } from 'express';
import { strings } from '@shared/Setup';
import { HTTPError } from '@shared/Errors';

export default async (
  _req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const { code, message } = (strings).errors.api.notFound;
  next(new HTTPError(code, message));
};