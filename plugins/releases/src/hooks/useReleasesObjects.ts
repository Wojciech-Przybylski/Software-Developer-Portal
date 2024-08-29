import { useEffect, useState } from 'react';
import axios from 'axios';
import { useEntity } from '@backstage/plugin-catalog-react';
import { Release } from '../api/types'; // Adjust the import path as necessary

/**
 * Custom hook for fetching releases data for a repository.
 * @returns An object containing the loading state, error state, and releases data.
 */
export const useReleasesObjects = () => {
  const { entity } = useEntity();
  const repositoryName = entity?.metadata?.name;
  
  // Use the following code to extract the owner name from the project slug annotation
  const projectSlug = entity?.metadata?.annotations?.['github.com/project-slug'];
  const ownerName = projectSlug ? projectSlug.split('/')[0] : undefined;

  // Currently, the owner name is hardcoded until we move into using github app within ONSDigital
  // const ownerName = "ONSDigital"

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [releasesData, setReleasesData] = useState<Release[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!repositoryName || !ownerName) {
        setError(true);
        setLoading(false);
        return;
      }

      try {
        console.log(`Fetching releases for repository: ${repositoryName}, owner: ${ownerName}`);
        const response = await axios.get(`http://localhost:7007/api/releases/health?owner=${ownerName}&repository=${repositoryName}`);
        setReleasesData(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching releases data:', error);
        setError(true);
        setLoading(false);
      }
    };

    fetchData();
  }, [repositoryName, ownerName]);

  return {
    loading,
    error,
    releasesData,
  };
};
