import { 
  createApiFactory,
  createPlugin,
  createRoutableExtension,
  discoveryApiRef,
  identityApiRef,
} from '@backstage/core-plugin-api';
import { S3ViewerBackendClient } from './api/S3viewerBackendClient';
import { s3ViewerApiRef } from './api/types';
import { rootCatalogS3viewerPluginRouteRef } from './routes';

export const s3viewerPlugin = createPlugin({
  id: 's3viewer',
  apis: [
    createApiFactory({
      api: s3ViewerApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        identityApi: identityApiRef,
      },
      factory: ({ discoveryApi, identityApi }) =>
        new S3ViewerBackendClient({ discoveryApi, identityApi }),
    }),
  ],
  routes: {
    root: rootCatalogS3viewerPluginRouteRef,
  },
});

export const EntityS3viewerContent = s3viewerPlugin.provide(
  createRoutableExtension({
    name: 'EntityS3viewerContent',
    component: () =>
      import('./components/BucketView').then(m => m.BucketView),
    mountPoint: rootCatalogS3viewerPluginRouteRef,
  }),
);