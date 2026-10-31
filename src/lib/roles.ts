export type Role = "OWNER" | "MANAGER" | "APPRAISER";

export function canManageTeam(role: Role): boolean {
  return role === "OWNER";
}

export function canManageSettings(role: Role): boolean {
  return role === "OWNER" || role === "MANAGER";
}

export function canEditInventory(role: Role): boolean {
  return role === "OWNER" || role === "MANAGER";
}

export function canEditPricing(role: Role): boolean {
  return role === "OWNER" || role === "MANAGER";
}

export function canCreateAppraisal(role: Role): boolean {
  return role === "OWNER" || role === "MANAGER" || role === "APPRAISER";
}

export function canApproveRecon(role: Role): boolean {
  return role === "OWNER" || role === "MANAGER";
}

export function canManageLab(role: Role): boolean {
  return role === "OWNER" || role === "MANAGER";
}

export function roleLabel(role: Role): string {
  switch (role) {
    case "OWNER":
      return "Owner";
    case "MANAGER":
      return "Manager";
    case "APPRAISER":
      return "Appraiser";
  }
}
