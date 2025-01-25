
//  Lib type imports
import type { Logger } from 'winston';

//  Lib local imports
import createLogger from '@utils/logger';

// Sync call
const logger: Logger = createLogger();

//  Export default
export default logger;