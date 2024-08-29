import { ResourcePermission, createPermission } from "@backstage/plugin-permission-common";
//Permission Definitions
export const fullAccess: ResourcePermission<"catalog-entity"> = createPermission({
  name: "catalog.entity.fullAccess",
  attributes: {
    action: "read",
  },
  resourceType: "catalog-entity",
});

export const techRadarAccess: ResourcePermission<"catalog-entity"> = createPermission({
  name: "catalog.entity.techRadarAccess",
  attributes: {
    action: "read",
  },
  resourceType: "catalog-entity",
});

export const customPermissions = [
    fullAccess,
    techRadarAccess
];