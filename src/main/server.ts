// App imports
import app from '@app';
import { env, logger } from '@shared/Setup';

app.listen(env.PORT, async () => {
  logger.info(`Server running on port ${env.PORT}`);
});