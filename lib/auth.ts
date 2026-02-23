import { getServerSession, type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import type { JWT } from "next-auth/jwt";

import { getRequiredEnv } from "@/lib/env";
import { findUserIdByEmail, findUserProfileById, syncOAuthUser } from "@/services/user.service";

type AuthToken = JWT & {
  subscriptionTier?: "free" | "pro" | "enterprise";
};

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: getRequiredEnv("GOOGLE_CLIENT_ID"),
      clientSecret: getRequiredEnv("GOOGLE_CLIENT_SECRET"),
    }),
  ],
  secret: getRequiredEnv("NEXTAUTH_SECRET"),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) {
        return false;
      }

      await syncOAuthUser({
        email: user.email,
        name: user.name,
        image: user.image,
      });
      return true;
    },
    async jwt({ token }) {
      if (!token.email) {
        return token;
      }

      const userId = await findUserIdByEmail(token.email);
      if (userId) {
        token.sub = userId;

        const profile = await findUserProfileById(userId);
        if (profile) {
          (token as AuthToken).subscriptionTier = profile.subscriptionTier;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.subscriptionTier = (token as AuthToken).subscriptionTier;
      }
      return session;
    },
  },
};

export function auth() {
  return getServerSession(authOptions);
}
