import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authenticateCredentials } from "@/services/auth-service";
import { roles, type UserRole } from "@/types/auth";
import { loginSchema } from "@/validation/auth";

function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && roles.includes(value as UserRole);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const result = loginSchema.safeParse(credentials);

        if (!result.success) {
          return null;
        }

        return authenticateCredentials(result.data);
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.organisationId = user.organisationId;
        token.role = user.role;
      }

      return token;
    },
    async session({ session, token }) {
      if (
        session.user &&
        typeof token.sub === "string" &&
        typeof token.organisationId === "string" &&
        isUserRole(token.role)
      ) {
        session.user.id = token.sub;
        session.user.organisationId = token.organisationId;
        session.user.role = token.role;
      }

      return session;
    },
  },
});
