//  Imports lib
import { join } from 'node:path';
import winston from 'winston';

//  Imports local
import { env } from "@shared/Setup";
import { getShortDate } from '@shared/Dates';

//  Exports
export default function createLogger () {
  return winston.createLogger({
    level: env.LOGGER_LEVEL,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json(),
    ),
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({
        filename: join(
          env.LOGGER_PATH,
          `${env.APP_NAME
            .toLowerCase()
            .replaceAll( 
                ' ', 
                '_'
            )
          }-error-${
            getShortDate()
          }.log`,
        ),
        level: 'error',
      }),
    ],
  });
}