
//  Lib local imports
import loadAndParseEnv from '@utils/env';
import { getFullDateISOFormat } from '@utils/dates';

//  Exports sync
export const env = loadAndParseEnv();
export const uptime: String = getFullDateISOFormat();