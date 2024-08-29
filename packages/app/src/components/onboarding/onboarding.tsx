import React, { useEffect, useState } from 'react';
import { useEntity } from '@backstage/plugin-catalog-react';
import { Typography } from '@material-ui/core';
import Markdown from 'markdown-to-jsx'; // or any other markdown rendering library

export const Onboarding = () => {
  const { entity } = useEntity();
  const path = entity?.metadata?.annotations?.['onboarding-docs'] || '';
  const [markdownContent, setMarkdownContent] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!path) {
          throw new Error('Path to markdown file not found in annotations');
        }
        const markdownFileResponse = await fetch(`${path}`);
        if (!markdownFileResponse.ok) {
          throw new Error(`Failed to fetch markdown file: ${markdownFileResponse.statusText}`);
        }
        const markdown = await markdownFileResponse.text();
        setMarkdownContent(markdown);
      } catch (error) {
        console.error('Error fetching markdown file:', error);
        // Handle error, e.g., set a default error message in state
      }
    };

    fetchData();
  }, [entity, path]);



  return (
    <div>
      <Markdown>{markdownContent}</Markdown>
    </div>
  );
};

export const onboardingPresent = () => {
  const { entity } = useEntity();
  const path = entity?.metadata?.annotations?.['onboarding-docs'] || '';

if (!path) {
  return false;
} else {

return true
}
}
