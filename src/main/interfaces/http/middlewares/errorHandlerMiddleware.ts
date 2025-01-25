import { Request, Response, NextFunction } from 'express';
import HTTPError from '@errors/HTTPError';
import {
  BAD_GATEWAY,
  INTERNAL_SERVER_ERROR,
  NOT_IMPLEMENTED,
  SERVICE_UNAVAILABLE,
} from '@shared/utils/status-codes';
import logger from '@logger';

export default async (
  err: Error | HTTPError,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err && err instanceof HTTPError) {
    switch (err.code) {
      case INTERNAL_SERVER_ERROR.code:
      case NOT_IMPLEMENTED.code:
      case BAD_GATEWAY.code:
      case SERVICE_UNAVAILABLE.code:
        logger.error(err.message);
        break;
      default:
        logger.info(err.message);
        break;
    }
    res.status(err.code).json({ message: err.message });
    return;
  }
  logger.error(err.message);
  res.status(NOT_IMPLEMENTED.code).json({ message: NOT_IMPLEMENTED.message });
};
