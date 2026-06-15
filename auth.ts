import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { rateLimit, clearRateLimit, clientIp } from "@/lib/ratelimit";

// Up to 10 attempts per IP+email every 15 minutes.
const LOGIN_MAX = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (credentials, request) => {
        const email = String(credentials?.email ?? "").toLowerCase().trim();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        // Throttle brute-force / credential-stuffing before touching the DB hash.
        const key = "login:" + clientIp(request as Request) + ":" + email;
        const limit = await rateLimit(key, LOGIN_MAX, LOGIN_WINDOW_MS);
        if (!limit.ok) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        // Honest users shouldn't keep burning their quota.
        await clearRateLimit(key);
        return { id: user.id, email: user.email };
      },
    }),
  ],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) token.id = user.id;
      return token;
    },
    session: ({ session, token }) => {
      if (token.id) session.user.id = String(token.id);
      return session;
    },
  },
});
