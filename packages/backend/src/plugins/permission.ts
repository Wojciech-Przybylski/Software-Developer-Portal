import {
  BackstageIdentityResponse,
} from '@backstage/plugin-auth-node';
import { createRouter } from '@backstage/plugin-permission-backend';
import {
  AuthorizeResult,
  PolicyDecision,
  isPermission,
} from '@backstage/plugin-permission-common';
import {
  PermissionPolicy,
  PolicyQuery,
} from '@backstage/plugin-permission-node';
import { Router } from 'express';
import {
  catalogEntityReadPermission,
  catalogEntityCreatePermission,
  catalogEntityDeletePermission,
  catalogLocationCreatePermission,
  catalogEntityRefreshPermission,
} from '@backstage/plugin-catalog-common/alpha';
import { PluginEnvironment } from '../types';
import { fullAccess, techRadarAccess } from './customPermissions'


class OrganisationPermissions implements PermissionPolicy {
  async handle(
    request: PolicyQuery,
    user?: BackstageIdentityResponse,
  ): Promise<PolicyDecision> {
    console.log('Checking request:', request);
  
   // Helper function to check if user is part of specific groups
  const isPartOfGroup = (groups: string[]) =>
    user?.identity.ownershipEntityRefs?.some(ref => groups.includes(ref.split('/')[1]));
  
  
  // TechRadar Access
  if (isPermission(request.permission, techRadarAccess)) {
    if (isPartOfGroup(['spp-sml'])) {
      console.log('Allowed Radar access');
      return { result: AuthorizeResult.ALLOW };
    } else {
      console.log('Denied Radar access');
      return { result: AuthorizeResult.DENY };
    }
  }
  
  // Full Access
  if (isPermission(request.permission, fullAccess)) {
    if (isPartOfGroup(['admin', 'dev-team'])) {
      console.log('Allowed full access');
      return { result: AuthorizeResult.ALLOW };
    } else {
      console.log('Denied full access');
      return { result: AuthorizeResult.DENY };
    }
  }
  
  // Catalog Read Permissions
  if (isPermission(request.permission, catalogEntityReadPermission) || isPermission(request.permission, catalogEntityRefreshPermission)) {
    if (isPartOfGroup(['admin', 'dev-team'])) {
      console.log('Allowed read permissions');
      return { result: AuthorizeResult.ALLOW };
    } else {
      console.log('Denied read permissions');
      return { result: AuthorizeResult.DENY };
    }
  }
  
  // Catalog Create Permissions
if (isPermission(request.permission, catalogEntityCreatePermission) 
    || isPermission(request.permission, catalogLocationCreatePermission)
    || request.permission.attributes.action === 'create'  
    || request.permission.resourceType === 'scaffolder-template' 
    || request.permission.resourceType === 'scaffolder-action') {
  if (isPartOfGroup(['admin'])) {
    console.log('Admin - catalog create permissions allowed');
    return { result: AuthorizeResult.ALLOW };
  } else {
    console.log('Admin - catalog create permissions denied');
    return { result: AuthorizeResult.DENY };
  }
}
  
  // Catalog Delete Permissions
  if (isPermission(request.permission, catalogEntityDeletePermission)) {
    if (isPartOfGroup(['admin'])) {
      console.log('Admin - catalog delete permissions allowed');
      return { result: AuthorizeResult.ALLOW };
    } else {
      console.log('Admin - catalog delete permissions denied');
      return { result: AuthorizeResult.DENY };
    }
  }
  
    // Default Deny
    console.log('Deny: Default');
    return { result: AuthorizeResult.DENY };
  }
}

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  return await createRouter({
    config: env.config,
    logger: env.logger,
    discovery: env.discovery,
    policy: new OrganisationPermissions(),
    identity: env.identity,
  });
}
