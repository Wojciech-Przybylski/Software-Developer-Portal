import { CatalogBuilder } from '@backstage/plugin-catalog-backend';
import { ScaffolderEntitiesProcessor } from '@backstage/plugin-scaffolder-backend';
import { Router } from 'express';
import { PluginEnvironment } from '../types';

import { GithubEntityProvider, GithubOrgEntityProvider } from '@backstage/plugin-catalog-backend-module-github';
import { AWSLambdaFunctionProvider, AWSS3BucketProvider, AWSIAMUserProvider } from '@roadiehq/catalog-backend-module-aws';

export class s3Manager {
  static s3Provider: AWSS3BucketProvider;
  static capture(s3Provider: AWSS3BucketProvider) {
    s3Manager.s3Provider = s3Provider;
  }
}

export class GitHubManager {
  static githubEntityProviders : GithubEntityProvider[];
  static githubOrgEntityProvider : GithubOrgEntityProvider;
  static capture(githubEntityProviders: GithubEntityProvider[], githubOrgEntityProvider: GithubOrgEntityProvider) {
    GitHubManager.githubEntityProviders = githubEntityProviders;
    GitHubManager.githubOrgEntityProvider = githubOrgEntityProvider
  }
}

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {

  const builder = await CatalogBuilder.create(env);

  const githubEntityProviders = GithubEntityProvider.fromConfig(env.config, {
    logger: env.logger,
    schedule: env.scheduler.createScheduledTaskRunner({
      frequency: { minutes: 1 },
      timeout: { minutes: 15 },
    }),
  });
  const githubOrgEntityProvider = GithubOrgEntityProvider.fromConfig(env.config, {
    id: 'production',
    orgUrl: 'https://github.com/ONS-Innovation',
    logger: env.logger,
    schedule: env.scheduler.createScheduledTaskRunner({
      frequency: { minutes: 1 },
      timeout: { minutes: 15 },
    }),
  });
  GitHubManager.capture(githubEntityProviders, githubOrgEntityProvider);

  const lambdaProvider = AWSLambdaFunctionProvider.fromConfig(env.config, env);
  const s3Provider = AWSS3BucketProvider.fromConfig(env.config, env);
  const iamProvider = AWSIAMUserProvider.fromConfig(env.config, env);
  s3Manager.capture(s3Provider);

  builder.addEntityProvider(githubEntityProviders);
  builder.addEntityProvider(githubOrgEntityProvider);
  builder.addEntityProvider(lambdaProvider);
  builder.addEntityProvider(s3Provider);
  builder.addEntityProvider(iamProvider);

  builder.addProcessor(new ScaffolderEntitiesProcessor());
  
  const { processingEngine, router } = await builder.build();

  lambdaProvider.run();
  s3Provider.run();
  iamProvider.run();

  await processingEngine.start();

  return router;
}
