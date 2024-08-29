import { CatalogClient } from '@backstage/catalog-client';
import { createBuiltinActions, createRouter } from '@backstage/plugin-scaffolder-backend';
import { Router } from 'express';
import type { PluginEnvironment } from '../types';
import { ScmIntegrations, DefaultGithubCredentialsProvider } from '@backstage/integration';


import { fromIni } from '@aws-sdk/credential-providers';
import { 
  createAwsS3CpAction, 
  createEcrAction, 
  createAwsSecretsManagerCreateAction,
} from '@roadiehq/scaffolder-backend-module-aws';

import {
  createS3BucketCpHtmlAction,
  createS3BucketCreateAction,
  createS3BucketEnableWebsiteAction,
  createS3ProviderRefreshAction,
} from './scaffolder/s3ScaffolderActions';

import { 
  createCreateMkdocsAction, 
  createCreateRulesetAction, 
  createEnableSecretScanningAction, 
  createGetBuildArtifactAction, 
  createRunGithubProvidersAction, 
  createUpdateMkdocsAction 
} from './scaffolder/githubScaffolderActions';

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  const catalogClient = new CatalogClient({
    discoveryApi: env.discovery,
  });

  const integrations = ScmIntegrations.fromConfig(env.config);
  const githubCredentialsProvider = DefaultGithubCredentialsProvider.fromIntegrations(integrations);

  const builtInActions = createBuiltinActions({
    integrations,
    catalogClient,
    config: env.config,
    reader: env.reader,
  });

  const awsCredentials = fromIni({profile: "default"});
  const awsActions = [
    createAwsS3CpAction({credentials: awsCredentials}),
    createEcrAction(),
    createAwsSecretsManagerCreateAction(),
  ];

  const customActions = [
    // S3
    createS3BucketCreateAction({credentials: awsCredentials}),
    createS3BucketEnableWebsiteAction({credentials: awsCredentials}),
    createS3BucketCpHtmlAction({credentials: awsCredentials}),
    createS3ProviderRefreshAction(),

    // GitHub
    createUpdateMkdocsAction({integrations, githubCredentialsProvider}),
    createRunGithubProvidersAction(),
    createCreateMkdocsAction({integrations, githubCredentialsProvider}),
    createGetBuildArtifactAction({integrations, githubCredentialsProvider}),
    createCreateRulesetAction({integrations, githubCredentialsProvider}),
    createEnableSecretScanningAction({integrations, githubCredentialsProvider}),
  ];

  const actions = [
    ...builtInActions,
    ...awsActions,
    ...customActions,
  ]

  return await createRouter({
    actions,
    logger: env.logger,
    config: env.config,
    database: env.database,
    reader: env.reader,
    catalogClient,
    identity: env.identity,
    // permissions: env.permissions, - deactivated, possibly due to package discrepancy or being deprecated  
  });
}
