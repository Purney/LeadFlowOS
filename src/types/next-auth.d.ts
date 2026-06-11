import type { DefaultSession } from "next-auth";
import type { UserRole } from "@/types/auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      organisationId: string;
      role: UserRole;
    };
  }

  interface User {
    organisationId: string;
    role: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    organisationId?: string;
    role?: UserRole;
  }
}
