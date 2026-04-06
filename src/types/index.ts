export type Role = 'super_admin' | 'stake_admin' | 'ward_admin' | 'comms_chair'
export type Scope = 'ward' | 'elders_quorum' | 'relief_society' | 'stake_all'
export type GroupTag = 'elders_quorum' | 'relief_society' | null

const ROLE_RANK: Record<Role, number> = {
  super_admin: 4,
  stake_admin: 3,
  ward_admin: 2,
  comms_chair: 1,
}

export function hasMinRole(userRole: Role, minRole: Role): boolean {
  return ROLE_RANK[userRole] >= ROLE_RANK[minRole]
}
