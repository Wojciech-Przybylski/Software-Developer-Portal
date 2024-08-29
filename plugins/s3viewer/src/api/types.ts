import { createApiRef } from '@backstage/core-plugin-api';

export type BucketData = {
  bucketNames: string[];
  bucketRegions: { [key: string]: string };
  bucketAccessability: { [key: string]: boolean };
  bucketVersioningStatus: { [key: string]: string[] };
  bucketTags: { [key: string]: string[] };
  bucketEncryption: { [key: string]: string[] };
  bucketEncryptionStatus: { [key: string]: string };
  bucketSizes: { [key: string]: number };
  bucketCreation: { [key: string]: string };
  bucketObjects: { [key: string]: string[] };
}

export interface S3ViewerApi {
  getHealth(): Promise<BucketData>;
}

export const s3ViewerApiRef = createApiRef<S3ViewerApi>({
  id: 'plugin.s3viewer-backend.service',
});
