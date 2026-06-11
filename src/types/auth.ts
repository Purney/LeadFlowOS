export const roles = ["owner", "admin", "member"] as const;

export type UserRole = (typeof roles)[number];

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  organisationId: string;
  role: UserRole;
};
