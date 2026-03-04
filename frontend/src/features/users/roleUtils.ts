export type UserRole = "RESIDENT" | "TENANT" | "HOA_ADMIN" | "ADMIN";

export function canManageCommunity(user?: { role?: string | null; communityAdmin?: boolean | null } | null): boolean {
  return user?.role === "ADMIN" || Boolean(user?.communityAdmin);
}

export function isSystemAdmin(role?: string | null): role is UserRole {
  return role === "ADMIN";
}

export function canVoteInHoaPolls(role?: string | null): boolean {
  return role === "RESIDENT" || role === "HOA_ADMIN" || role === "ADMIN";
}

export function roleLabel(role: string): string {
  if (role === "HOA_ADMIN") return "Global HOA Admin";
  if (role === "ADMIN") return "System Admin";
  if (role === "TENANT") return "Tenant";
  return "Resident";
}
