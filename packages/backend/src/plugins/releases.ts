import { Config } from '@backstage/config'
import { PluginEnvironment } from '../types';
import { createRouter } from '../../../../plugins/releases-backend/src/service/router';

export default async function createPlugin(config: Config, env: PluginEnvironment) {
  // Here is where you will add all of the required initialization code that
  // your backend plugin needs to be able to start!

  // The env contains a lot of goodies, but our router currently only
  // needs a logger
  return await createRouter({
    config,
    logger: env.logger,
  });
}