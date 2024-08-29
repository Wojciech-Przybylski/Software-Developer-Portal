import express, { Request, Response } from 'express';
import { Logger } from 'winston';
import { Config } from '@backstage/config';
import AWS from 'aws-sdk';

export interface RouterOptions {
  config: Config;
  logger: Logger;
}

export async function createRouter(options: RouterOptions): Promise<express.Router> {
  const { logger, config } = options;

  // Initializing AWS SDK with provided credentials and region
  AWS.config.update({
    region: 'eu-west-2',
    apiVersion: 'latest',
    accessKeyId: config.getString('integrations.s3viewer.accessKeyId'),
    secretAccessKey: config.getString('integrations.s3viewer.secretAccessKey'),
  });

  const s3 = new AWS.S3();

  const router = express.Router();

  // Health check endpoint
  router.get('/health', async (req: Request, response: Response) => {
    try {
      // Fetch bucket data asynchronously
      const bucketData = await fetchBucketData(s3);
      response.json(bucketData);
    } catch (error) {
      logger.error('Error fetching bucket data:', error);
      response.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}

// Functions to fetch various data related to S3 buckets asynchronously
// Each function fetches specific data and returns a Promise with the result as a dictionary objects with the bucket name as key and the data as value
// Each function uses try...catch error handling

// Function to get the regions of the buckets, using the SDK function to - getBucketLocation() - for each bucket
async function getBucketRegions(s3: AWS.S3, bucketNames: string[]): Promise<{ [key: string]: string }> {
  const bucketRegions: { [key: string]: string } = {};
  await Promise.all(bucketNames.map(async bucketName => {
    try {
      const location = await s3.getBucketLocation({ Bucket: bucketName }).promise();
      bucketRegions[bucketName] = location.LocationConstraint || 'Unknown';
    } catch (error) {
      console.error(`Error fetching region for bucket '${bucketName}':`, error);
    }
  }));
  return bucketRegions;
}

// Function to get information whether the buckets have versioning enabled, using the SDK function to - getBucketVersioning() - status for each bucket
async function getBucketVersioningStatus(s3: AWS.S3, bucketNames: string[]): Promise<{ [key: string]: string[] }> {
  const bucketVersioningStatus: { [key: string]: string[] } = {};
  await Promise.all(bucketNames.map(async bucketName => {
    try {
      const versioning = await s3.getBucketVersioning({ Bucket: bucketName }).promise();
      if (versioning && versioning.Status !== undefined) {
        bucketVersioningStatus[bucketName] = versioning.Status.split(',').map(key => key.trim());
      }
    } catch (error) {
      console.error(`Error fetching versioning status for bucket '${bucketName}':`, error);
    }
  }));
  return bucketVersioningStatus;
}

// Function to retrieve objects in the bucket, using the SDK function to - listObjects() - of each bucket
async function getBucketObjects(s3: AWS.S3, bucketNames: string[]): Promise<{ [key: string]: string[] }> {
  const bucketObjects: { [key: string]: string[] } = {};
  await Promise.all(bucketNames.map(async bucketName => {
    try {
      const list = await s3.listObjects({ Bucket: bucketName }).promise();
      if (list.Contents) {
        bucketObjects[bucketName] = list.Contents.map(content => content.Key).filter(key => key !== undefined) as string[];
      }
    } catch (error) {
      console.error(`Error fetching objects for bucket '${bucketName}':`, error);
    }
  }));
  return bucketObjects;
}

// Function to retrieve tags associated with the bucket, using the SDK function to - getBucketTagging() - for each bucket
async function getBucketTags(s3: AWS.S3, bucketNames: string[]): Promise<{ [key: string]: string[] }> {
  const bucketTags: { [key: string]: string[] } = {};
  await Promise.all(bucketNames.map(async bucketName => {
    try {
      const Tagging = await s3.getBucketTagging({ Bucket: bucketName }).promise();
      if (Tagging && Tagging.TagSet !== undefined) {
        bucketTags[bucketName] = Tagging.TagSet.map(content => content.Key);
      }
    } catch (error) {
      console.error(`No tags present for bucket '${bucketName}'`);
    }
  }));
  return bucketTags;
}

// Function to get information whether the buckets is publicly accessible or not, using the SDK function to - getPublicAccessBlock() - information and retun a boolean value
async function isBucketPublic(s3: AWS.S3, bucketNames: string[]): Promise<{ [key: string]: boolean }> {
  const bucketAccessability: { [key: string]: boolean } = {};
  await Promise.all(bucketNames.map(async bucketName => {
    try {
      const access = await s3.getPublicAccessBlock({ Bucket: bucketName }).promise();
      if (access) {
        bucketAccessability[bucketName] = !!access.PublicAccessBlockConfiguration?.BlockPublicPolicy;
      }
    } catch (error) {
      console.error(`Error fetching access control for bucket '${bucketName}':`, error);
    }
  }));
  return bucketAccessability;
}

// Function to retrieve the bucket size, totaling all the objects in the bucket and returning the total size
async function getBucketSize(s3: AWS.S3, bucketNames: string[]): Promise<{ [key: string]: number }> {
  const bucketSizes: { [key: string]: number } = {};
  await Promise.all(bucketNames.map(async bucketName => {
    try {
      const data = await s3.listObjects({ Bucket: bucketName }).promise();
      if (data.Contents) {
        const totalSize = data.Contents.reduce((acc, content) => acc + (content.Size || 0), 0);
        const totalSizeInKB = Math.round(totalSize / 1024 * 10) / 10;
        bucketSizes[bucketName] = totalSizeInKB;
      }
    } catch (error) {
      console.error(`Error fetching size for bucket '${bucketName}':`, error);
    }
  }));
  return bucketSizes;
}

// Function to retrieve the bucket creation date, using the SDK function to - listBuckets() - and instead of getting the bucket name get the bucket creation date then link it to the bucket 
async function getCreationDate(s3: AWS.S3, bucketNames: string[]): Promise<{ [key: string]: Date }> {
  const bucketCreation: { [key: string]: Date } = {};
  await Promise.all(bucketNames.map(async bucketName => {
    try {
      const listBucketsResponse = await s3.listBuckets().promise();
      const bucket = listBucketsResponse.Buckets?.find(bucket => bucket.Name === bucketName);
      if (bucket) {
        bucketCreation[bucketName] = bucket.CreationDate || new Date();
      } else {
        console.error(`Bucket '${bucketName}' not found.`);
      }
    } catch (error) {
      console.error(`Error fetching date for bucket '${bucketName}':`, error);
    }
  }));
  return bucketCreation;
}

// Function to retrieve the bucket encryption status, using the SDK function to - getBucketEncryption() - information and return as a string 'Enabled'/'Disabled' if encryption is present
async function getBucketEncryptionStatus(s3: AWS.S3, bucketNames: string[]): Promise<{ [key: string]: string }> {
  const bucketEncryptionStatus: { [key: string]: string } = {};
  await Promise.all(bucketNames.map(async bucketName => {
    try {
      const Encryption = await s3.getBucketEncryption({ Bucket: bucketName }).promise();
      if (Encryption && Encryption.ServerSideEncryptionConfiguration && Encryption.ServerSideEncryptionConfiguration.Rules) {
        bucketEncryptionStatus[bucketName] = 'Enabled';
      } else {
        bucketEncryptionStatus[bucketName] = 'Disabled';
      }
    } catch (error) {
      console.error(`Error fetching encryption status for bucket '${bucketName}':`, error);
    }
  }));
  return bucketEncryptionStatus;
}

// Function to retrieve the encryption used by the bucket, using the SDK function to - getBucketEncryption() - type 
async function getBucketEncryption(s3: AWS.S3, bucketNames: string[]): Promise<{ [key: string]: string[] }> {
  const bucketEncryption: { [key: string]: string[] } = {};
  await Promise.all(bucketNames.map(async bucketName => {
    try {
      const Encryption = await s3.getBucketEncryption({ Bucket: bucketName }).promise();
      if (Encryption && Encryption.ServerSideEncryptionConfiguration && Encryption.ServerSideEncryptionConfiguration.Rules) {
        bucketEncryption[bucketName] = Encryption.ServerSideEncryptionConfiguration.Rules.map(rule => {
          if (rule.ApplyServerSideEncryptionByDefault) {
            return rule.ApplyServerSideEncryptionByDefault.SSEAlgorithm;
          } else {
            return '';
          }
        });
      } else {
        bucketEncryption[bucketName] = [];
      }
    } catch (error) {
      console.error(`Error fetching encryption for bucket '${bucketName}':`, error);
      bucketEncryption[bucketName] = [];
    }
  }));
  return bucketEncryption;
}

// Function to fetch all relevant bucket data in one go and return it as a single array
async function fetchBucketData(s3: AWS.S3): Promise<any> {
  const listBucketsResponse = await s3.listBuckets().promise();
  const bucketNames: string[] = listBucketsResponse.Buckets?.map(bucket => bucket.Name) || [];

  const [
    bucketRegions,
    bucketVersioningStatus,
    bucketObjects,
    bucketTags,
    bucketAccessability,
    bucketSizes,
    bucketCreation,
    bucketEncryptionStatus,
    bucketEncryption

  ] = await Promise.all([
    getBucketRegions(s3, bucketNames),
    getBucketVersioningStatus(s3, bucketNames),
    getBucketObjects(s3, bucketNames),
    getBucketTags(s3, bucketNames),
    isBucketPublic(s3, bucketNames),
    getBucketSize(s3, bucketNames),
    getCreationDate(s3, bucketNames),
    getBucketEncryptionStatus(s3, bucketNames),
    getBucketEncryption(s3, bucketNames)

  ]);

  const bucketData = {
    bucketNames, 
    bucketRegions,
    bucketVersioningStatus,
    bucketObjects,
    bucketTags,
    bucketAccessability,
    bucketSizes,
    bucketCreation,
    bucketEncryptionStatus,
    bucketEncryption
  };

  return bucketData;
}
