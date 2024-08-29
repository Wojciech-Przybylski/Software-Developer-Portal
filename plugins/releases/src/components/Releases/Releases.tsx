import React from 'react';
import { CircularProgress, Typography } from '@material-ui/core';
import { useReleasesObjects } from '../../hooks/useReleasesObjects'; // Importing the custom hook for fetching releases data
import { Card } from '../card'; // Importing the Card component
import { Release } from '../../api/types'; // Importing the Release type from the API

// The main component for displaying releases
export const Releases = () => {
  const { loading, error, releasesData } = useReleasesObjects(); // Using the custom hook to fetch releases data

  if (loading) {
    return <CircularProgress />; // Display a loading spinner if data is still loading
  }

  if (error) {
    return <Typography color="error">Error fetching releases data.</Typography>; // Display an error message if there was an error fetching data
  }

  if (!releasesData || releasesData.length === 0) {
    return <Typography>No releases data available.</Typography>; // Display a message if there are no releases data available
  }

  return (
    <div>
      {/* Render each release as a Card component */}
      {Array.isArray(releasesData) && releasesData.map((release: Release, index: number) => (
        <Card
          key={index}
          name={release.name}
          created_at={release.created_at}
          assets={release.assets}
          body={release.body}
          prerelease={release.prerelease}
          isNewest={index === 0}
          author={release.author.login}
          url={release.html_url}
          message={release.message}
        />
      ))}
    </div>
  );
};