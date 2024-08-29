import { createServiceBuilder } from '@backstage/backend-common';
import { Server } from 'http';
import { Logger } from 'winston'; // Import config as winstonConfig
import { createRouter } from './router';
import { Config } from '@backstage/config';

export interface ServerOptions {
  port: number;
  enableCors: boolean; // Add enableCors option
  logger: Logger;
  config: Config
}

export async function startStandaloneServer(
  options: ServerOptions,
): Promise<Server> {
  const logger = options.logger.child({ service: 'releases-backend' });
  logger.debug('Starting application server...');
  const router = await createRouter({
    config: options.config, // Use options.config instead of config
    logger,
  });

  let service = createServiceBuilder(module)
    .setPort(options.port)
    .addRouter('/releases', router);
  
  // Enable CORS if enableCors option is set to true
  if (options.enableCors) {
    service = service.enableCors({ origin: options.config.getString('app.baseUrl'), }); // Use options.config instead of config
  }

  return await service.start().catch(err => {
    logger.error(err);
    process.exit(1);
  });
}

module.hot?.accept();