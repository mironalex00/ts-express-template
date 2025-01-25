// App imports
import server from '@server';
import { env } from '@config/setup';
import logger from '@logger';

server.listen(env.PORT, async () => {
  logger.info(`Server running on port ${env.PORT}`);
});
