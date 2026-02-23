import { getServerSession, type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

import { connectToDatabase } from "@/lib/db";
import { getRequiredEnv } from "@/lib/env";
import { User } from "@/models/User";

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

      await connectToDatabase();
      await User.findOneAndUpdate(
        { email: user.email },
        {
          name: user.name ?? "",
          image: user.image ?? "",
          lastLoginAt: new Date(),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
      return true;
    },
    async jwt({ token }) {
      if (!token.email) {
        return token;
      }

      await connectToDatabase();
      const dbUser = await User.findOne({ email: token.email }).lean();
      if (dbUser) {
        token.sub = dbUser._id.toString();
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
};

export function auth() {
  return getServerSession(authOptions);
}
