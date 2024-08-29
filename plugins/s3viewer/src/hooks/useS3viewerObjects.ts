import { useEffect, useState } from 'react';
import axios from 'axios';
import { BucketData } from '../api/types';


export const useS3viewerObjects = () => {
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [bucketData, setBucketData] = useState<BucketData>();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:7007/api/s3viewer/health'); // Need to have dynamic response using the backend URL host present in the app.config.yaml.
        setBucketData(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching bucket data:', error);
        setError(true);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return {
    loading,
    error,
    bucketData,
  };
};
