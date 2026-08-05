export const ROLE_PERMISSIONS = {
  super_admin: ["*"],
  admin: [
    "dashboard.view",
    "events.view",
    "events.manage",
    "participants.view",
    "participants.manage",
    "reports.view",
    "users.manage",
    "roles.manage",
    "audit.view",
    "settings.manage",
  ],
  event_manager: [
    "dashboard.view",
    "events.view",
    "events.manage",
    "participants.view",
    "participants.manage",
    "reports.view",
    "audit.view",
  ],
  volunteer: [
    "dashboard.view",
    "participants.view",
    "participants.manage",
  ],
  viewer: [
    "dashboard.view",
    "events.view",
    "participants.view",
    "reports.view",
    "audit.view",
  ],
};

export const staffRoles = Object.keys(ROLE_PERMISSIONS);

export function canAccess(role, permission) {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes("*") || permissions.includes(permission);
}

export const roleOptions = [
  { id: "user", label: "User" },
  { id: "viewer", label: "Viewer" },
  { id: "volunteer", label: "Volunteer" },
  { id: "event_manager", label: "Event Manager" },
  { id: "admin", label: "Admin" },
  { id: "super_admin", label: "Super Admin" },
];
