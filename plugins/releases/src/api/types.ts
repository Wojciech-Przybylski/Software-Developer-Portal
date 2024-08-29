import { createApiRef } from '@backstage/core-plugin-api';

export interface Release {
  name: string;
  created_at: string;
  assets: { [name: string]: string[] };
  body: string;
  prerelease: boolean;
  author: { login: string };
  html_url: string;
  message: string;
}

export interface ReleasesApi {
  getHealth(): Promise<Release>;
}

export const releasesApiRef = createApiRef<ReleasesApi>({
  id: 'plugin.releases-backend.service',
});



