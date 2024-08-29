import { 
createApiFactory,
createPlugin,
createRoutableExtension,
discoveryApiRef,
identityApiRef,
} from '@backstage/core-plugin-api';import { ReleasesBackendClient } from './api/ReleasesBackendClient';
import { releasesApiRef } from './api/types';
import { rootCatalogReleasesPluginRouteRef } from './routes';



// Create a plugin using the createPlugin function
export const releasesPlugin = createPlugin({
id: 'releases', // Unique identifier for the plugin
apis: [
  createApiFactory({
    api: releasesApiRef, // Reference to the API provided by the plugin
    deps: {
      discoveryApi: discoveryApiRef, // Reference to the discovery API
      identityApi: identityApiRef, // Reference to the identity API
    },
    factory: ({ discoveryApi, identityApi }) =>
      new ReleasesBackendClient({ discoveryApi, identityApi }), // Create an instance of the ReleasesBackendClient using the provided APIs
  }),
],
routes: {
  root: rootCatalogReleasesPluginRouteRef, // Define the root route for the plugin
},
});

// Create a routable extension using the createRoutableExtension function
export const EntityReleasesContent = releasesPlugin.provide(
createRoutableExtension({
  name: 'EntityReleasesContent', // Name of the extension
  component: () =>
    import('./components/Releases').then(m => m.Releases), // Dynamically import the Releases component
  mountPoint: rootCatalogReleasesPluginRouteRef, // Mount the extension at the root route defined earlier
}),
);
