import { createServiceBuilder } from '@backstage/backend-common';
import { Server } from 'http';
import { Logger } from 'winston';
import { createRouter } from './router';
import { ConfigReader } from '@backstage/config';

export interface ServerOptions {
  port: number;
  enableCors: boolean; // Add enableCors option
  logger: Logger;
}
const backendConfig = {
  intergration: {
    s3viewer:{
      awsAccessKeyID: "${AWS_ACCESS_KEY_ID}",
      secretAccessKey: "${AWS_SECRET_ACCESS_KEY}"
    }
}}
const config = new ConfigReader(backendConfig);

export async function startStandaloneServer(
  options: ServerOptions,
): Promise<Server> {
  const logger = options.logger.child({ service: 's3viewer-backend' });
  logger.debug('Starting application server...');
  const router = await createRouter({
    config,
    logger,
  });

  let service = createServiceBuilder(module)
    .setPort(options.port)
    .addRouter('/s3viewer', router);
  
  // Enable CORS if enableCors option is set to true
  if (options.enableCors) {
    service = service.enableCors({ origin: config.getString('app.baseUrl'), });
  }

  return await service.start().catch(err => {
    logger.error(err);
    process.exit(1);
  });
}

module.hot?.accept();