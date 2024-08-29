import { S3ViewerApi, BucketData } from './types';
import { DiscoveryApi, IdentityApi } from '@backstage/core-plugin-api';

export class S3ViewerBackendClient implements S3ViewerApi {
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
  async getHealth(): Promise<BucketData> {
    const url = `${await this.discoveryApi.getBaseUrl('s3viewer')}/health`;
    const response = await fetch(url, {
      method: 'GET',
    });
    return await this.handleResponse<BucketData>(response);
  }
}
