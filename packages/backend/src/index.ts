/*
 * Hi!
 *
 * Note that this is an EXAMPLE Backstage backend. Please check the README.
 *
 * Happy hacking!
 */

import Router from 'express-promise-router';
import {
  createServiceBuilder,
  loadBackendConfig,
  getRootLogger,
  useHotMemoize,
  notFoundHandler,
  CacheManager,
  DatabaseManager,
  HostDiscovery,
  UrlReaders,
  ServerTokenManager,
} from '@backstage/backend-common';
import { TaskScheduler } from '@backstage/backend-tasks';
import { Config } from '@backstage/config';
import app from './plugins/app';
import auth from './plugins/auth';
import catalog from './plugins/catalog';
import scaffolder from './plugins/scaffolder';
import proxy from './plugins/proxy';
import techdocs from './plugins/techdocs';
import search from './plugins/search';
import { PluginEnvironment } from './types';
import { ServerPermissionClient } from '@backstage/plugin-permission-node';
import { DefaultIdentityClient } from '@backstage/plugin-auth-node';
import { createAuthMiddleware } from './authMiddleware';
import s3viewer from './plugins/s3viewer';
import permission from './plugins/permission';
import releases from './plugins/releases';
import kubernetes from './plugins/kubernetes';
import chatGPTBackend from './plugins/chatgpt';
import cookieParser from 'cookie-parser';




function makeCreateEnv(config: Config) {
  const root = getRootLogger();
  const reader = UrlReaders.default({ logger: root, config });
  const discovery = HostDiscovery.fromConfig(config);
  const cacheManager = CacheManager.fromConfig(config);
  const databaseManager = DatabaseManager.fromConfig(config, { logger: root });
  const tokenManager = ServerTokenManager.fromConfig(config, { logger: root });
  const taskScheduler = TaskScheduler.fromConfig(config, { databaseManager });

  const identity = DefaultIdentityClient.create({
    discovery,
  });
  const permissions = ServerPermissionClient.fromConfig(config, {
    discovery,
    tokenManager,
  });

  root.info(`Created UrlReader ${reader}`);

  return (plugin: string): PluginEnvironment => {
    const logger = root.child({ type: 'plugin', plugin });
    const database = databaseManager.forPlugin(plugin);
    const cache = cacheManager.forPlugin(plugin);
    const scheduler = taskScheduler.forPlugin(plugin);
    return {
      logger,
      database,
      cache,
      config,
      reader,
      discovery,
      tokenManager,
      scheduler,
      permissions,
      identity,
    };
  };
}

async function main() {
  const config = await loadBackendConfig({
    argv: process.argv,
    logger: getRootLogger(),
  });
  const createEnv = makeCreateEnv(config);
  
  const catalogEnv = useHotMemoize(module, () => createEnv('catalog'));
  const scaffolderEnv = useHotMemoize(module, () => createEnv('scaffolder'));
  const authEnv = useHotMemoize(module, () => createEnv('auth'));
  const proxyEnv = useHotMemoize(module, () => createEnv('proxy'));
  const techdocsEnv = useHotMemoize(module, () => createEnv('techdocs'));
  const searchEnv = useHotMemoize(module, () => createEnv('search'));
  const kubernetesEnv = useHotMemoize(module, () => createEnv('kubernetes'));
  const chatGptEnv = useHotMemoize(module, () => createEnv('chatgpt-backend'));
  const appEnv = useHotMemoize(module, () => createEnv('app'));
  const announcementsEnv = useHotMemoize(module, () => createEnv('announcements'));
  const permissionEnv = useHotMemoize(module, () => createEnv('permission'));
  const s3viewerEnv = useHotMemoize(module, () => createEnv('s3viewer'));
  const releasesEnv = useHotMemoize(module, () => createEnv('releases'));

  const authMiddleware = await createAuthMiddleware(config, appEnv);


  const apiRouter = Router();

  apiRouter.use(cookieParser());
  // The auth route must be publicly available as it is used during login
  apiRouter.use('/auth', await auth(authEnv));
  // Add a simple endpoint to be used when setting a token cookie
  apiRouter.use('/cookie', authMiddleware, (_req, res) => {
    res.status(200).send(`Coming right up`);
  });
  // Only authenticated requests are allowed to the routes below
  apiRouter.use('/catalog', authMiddleware, await catalog(catalogEnv));
  apiRouter.use('/techdocs', authMiddleware, await techdocs(techdocsEnv));
  apiRouter.use('/proxy', authMiddleware, await proxy(proxyEnv));
  apiRouter.use('/scaffolder', authMiddleware, await scaffolder(scaffolderEnv));
  apiRouter.use('/search', authMiddleware, await search(searchEnv));
  apiRouter.use('/kubernetes', authMiddleware, await kubernetes(kubernetesEnv));
  apiRouter.use('/chatgpt', authMiddleware, await chatGPTBackend(chatGptEnv));
  apiRouter.use('/permission', authMiddleware, await permission(permissionEnv));
  apiRouter.use('/s3viewer', await s3viewer(config, s3viewerEnv));
  apiRouter.use('/releases', await releases(config, releasesEnv));
  apiRouter.use(authMiddleware, notFoundHandler());


  // Add backends ABOVE this line; this 404 handler is the catch-all fallback


  apiRouter.use(notFoundHandler());

  const service = createServiceBuilder(module)
    .loadConfig(config)
    .addRouter('/api', apiRouter)
    .addRouter('', await app(appEnv));

  await service.start().catch(err => {
    console.log(err);
    process.exit(1);
  });
}

module.hot?.accept();
main().catch(error => {
  console.error('Backend failed to start up', error);
  process.exit(1);
});
