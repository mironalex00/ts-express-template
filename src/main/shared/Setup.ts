//  Lib type imports
import type { Logger } from 'winston';

//  Local imports
import { getFullDateISOFormat } from '@shared/Dates';
import loadAndParseEnv from '@shared/EnvConfig';
import loadAppStrings from '@shared/AppStrings';
import createLogger from '@shared/Logger';

//  Exports sync
export const env = loadAndParseEnv();
export const strings = loadAppStrings();
export const logger: Logger = createLogger();
export const uptime: String = getFullDateISOFormat();