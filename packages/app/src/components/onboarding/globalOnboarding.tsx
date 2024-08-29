import { TechDocsReaderPage, Entity } from '@backstage/plugin-techdocs'
import React from "react";

export const GlobalOnboarding = () => {
  // Create a CompoundEntityRef object
  const entityRef: Entity = {
    kind: 'Component',
    namespace: 'default',
    name: 'ons_onboarding',
  };

  return (
    <TechDocsReaderPage entityRef={entityRef} />
  );
};