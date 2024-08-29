import { ReleasesApi, Release } from './types';
import { DiscoveryApi, IdentityApi } from '@backstage/core-plugin-api';

export class ReleasesBackendClient implements ReleasesApi {
  private readonly discoveryApi: DiscoveryApi;
  private readonly identityApi: IdentityApi;
  constructor(options: {
    discoveryApi: DiscoveryApi;
    identityApi: IdentityApi;
  }) {
    this.discoveryApi = options.discoveryApi;
    this.identityApi = options.identityApi;
  }
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      throw new Error();
    }
    return await response.json();
  }
  async getHealth(): Promise<Release> {
    const url = `${await this.discoveryApi.getBaseUrl('releases')}/health`;
    const response = await fetch(url, {
      method: 'GET',
    });
    return await this.handleResponse<Release>(response);
  }
}