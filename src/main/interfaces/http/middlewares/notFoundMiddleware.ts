import { Request, Response, NextFunction } from 'express';
import HTTPError from '@errors/HTTPError';

export default async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  next(new HTTPError(404, `Resource '${req.path}' not found`));
};