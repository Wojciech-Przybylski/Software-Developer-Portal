import React from 'react';
import { useEntity } from '@backstage/plugin-catalog-react';
import { Tab } from '../Tab';
import { useS3viewerObjects } from '../../hooks/useS3viewerObjects';

// Function to check if buckets are present in the entity's catalog-info.yaml file, used for to determine whether to render the UI in the portal 
export const checkBucket = () => {
  const { entity } = useEntity();
  const bucketPresent = entity?.metadata?.cloud?.['buckets'] || [];
  return bucketPresent.length !== 0;
};

// Functional component to display bucket information
export const BucketView = () => {
  const { entity } = useEntity();
  const { loading, error } = useS3viewerObjects();
  const bucketIDs = entity?.metadata?.cloud?.['buckets'] || [];
  const bucketIDsArray = bucketIDs.split(',');
  const { bucketData } = useS3viewerObjects();

  // Function to get region information for a given bucket
  const getRegionInfo = (bucketName) => {
    const regionInfo = bucketData?.bucketRegions[bucketName];
    return regionInfo || 'Region not found';
  };

  // Function to get accessibility status for a given bucket
  const getAccessability = (bucketName) => {
    const AccessInfo = bucketData?.bucketAccessability[bucketName];
    return AccessInfo ? 'Public Access is Blocked' : 'Public Access is Enabled';
  };

  // Function to get versioning status for a given bucket
  const getVersioning = (bucketName) => {
    const VersioningInfo = bucketData?.bucketVersioningStatus[bucketName];
    return VersioningInfo || 'Disabled';
  };

  // Function to get creation date for a given bucket
  const getCreationDate = (bucketName) => {
    if (!bucketData || !bucketData.bucketCreation || !bucketData.bucketCreation[bucketName]) {
      return 'Not Present';
    }
    const creationDateInfo = bucketData.bucketCreation[bucketName];
    const creationDate = new Date(creationDateInfo);
    if (isNaN(creationDate.getTime())) {
      return 'Invalid Date';
    }
    return creationDate.toLocaleString();
  };

  // Function to get size information for a given bucket
  const getSize = (bucketName) => {
    const sizeInfo = bucketData?.bucketSizes[bucketName];
    return sizeInfo ? sizeInfo + 'KB' : 'Not Present';
  };

  // Function to get tags for a given bucket
  const getTags = (bucketName) => {
    const TagInfo = bucketData?.bucketTags[bucketName];
    return TagInfo?.join(', ') || 'Not Present';
  };

  // Function to get encryption type for a given bucket
  const getEncryption = (bucketName) => {
    const EncryptionInfo = bucketData?.bucketEncryption[bucketName];
    return EncryptionInfo || 'Not Present';
  };

  // Function to get encryption status for a given bucket
  const getEncryptionStatus = (bucketName) => {
    const EncryptionStatusInfo = bucketData?.bucketEncryptionStatus[bucketName];
    return EncryptionStatusInfo || 'Not Present';
  };

  // Function to get objects names and number of the objects present for a given bucket
  const getObjects = (bucketName) => {
    const bucketObjects = bucketData?.bucketObjects[bucketName] || [];
    const objectList = bucketObjects.join(', ');
    const totalObjects = bucketObjects.length;

    return { objectList, totalObjects };
  };

  // Function to generate link for a given bucket
  const getLink = (bucketName) => {
    const link = `https://${getRegionInfo(bucketName)}.console.aws.amazon.com/s3/buckets/${bucketName}?region=${getRegionInfo(bucketName)}`;
    return link;
  };

  if (loading) {
    return <div>Loading</div>;
  }

  if (error) {
    return <div>Error</div>;
  }

  // Rendering bucket information in the tab component
  return (
    <div>
      {bucketIDsArray.map((bucket, index) => {
      const bucketTrim = bucket.trim();

        return (
          <Tab
            key={index}
            name={bucketTrim}
            created_at={getCreationDate(bucketTrim)}
            region={getRegionInfo(bucketTrim)}
            accessability={getAccessability(bucketTrim)}
            totalObjects={getObjects(bucketTrim).totalObjects}
            objectList={getObjects(bucketTrim).objectList}
            size={getSize(bucketTrim)}
            versioning={getVersioning(bucketTrim)}
            encryptionSatus={getEncryptionStatus(bucketTrim)}
            encryption={getEncryption(bucketTrim)}
            tags={getTags(bucketTrim)}
            Link={getLink(bucketTrim)}
          />
        );
      })}
    </div>
  );
};
