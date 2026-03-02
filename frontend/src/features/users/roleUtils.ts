export type UserRole = "RESIDENT" | "TENANT" | "HOA_ADMIN" | "ADMIN";

export function isHoaManager(role?: string | null): role is UserRole {
  return role === "HOA_ADMIN" || role === "ADMIN";
}

export function isSystemAdmin(role?: string | null): role is UserRole {
  return role === "ADMIN";
}

export function canVoteInHoaPolls(role?: string | null): boolean {
  return role === "RESIDENT" || role === "HOA_ADMIN" || role === "ADMIN";
}

export function roleLabel(role: string): string {
  if (role === "HOA_ADMIN") return "HOA Admin";
  if (role === "ADMIN") return "Admin";
  if (role === "TENANT") return "Tenant";
  return "Resident";
}
