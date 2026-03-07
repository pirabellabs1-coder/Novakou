import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { checkRateLimit, recordFailedAttempt, resetAttempts } from "./rate-limiter";

// Types etendus pour le JWT et la session
declare module "next-auth" {
  interface User {
    role?: string;
    kyc?: number;
    plan?: string;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      kyc: number;
      plan: string;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    kyc: number;
    plan: string;
  }
}

const IS_DEV_MODE = process.env.DEV_MODE === "true";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;

        if (!email || !password) return null;

        // Rate limiting
        const rateCheck = checkRateLimit(email);
        if (!rateCheck.allowed) {
          throw new Error("Trop de tentatives. Reessayez dans 15 minutes.");
        }

        // ── MODE DEV : authentification via store JSON local ──────────
        if (IS_DEV_MODE) {
          try {
            const { devStore } = await import("../dev/dev-store");
            const user = devStore.findByEmail(email);
            if (!user) {
              recordFailedAttempt(email);
              return null;
            }
            if (user.status !== "ACTIF") {
              throw new Error("Votre compte est desactive.");
            }
            const valid = await bcrypt.compare(password, user.passwordHash);
            if (!valid) {
              recordFailedAttempt(email);
              return null;
            }
            resetAttempts(email);
            devStore.updateLastLogin(user.id);
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              kyc: user.kyc,
              plan: user.plan,
            };
          } catch (err) {
            if (err instanceof Error && (err.message.includes("tentatives") || err.message.includes("desactive"))) throw err;
            console.error("[AUTH DEV] Erreur:", err);
            return null;
          }
        }

        // ── MODE PRODUCTION : authentification via Prisma / Supabase ──
        try {
          const { prisma } = await import("@freelancehigh/db");
          const user = await prisma.user.findUnique({
            where: { email },
            select: {
              id: true,
              email: true,
              name: true,
              passwordHash: true,
              role: true,
              kyc: true,
              plan: true,
              status: true,
            },
          });

          if (!user || !user.passwordHash) {
            recordFailedAttempt(email);
            return null;
          }

          if (user.status !== "ACTIF") {
            throw new Error("Votre compte est desactive. Contactez le support.");
          }

          const valid = await bcrypt.compare(password, user.passwordHash);
          if (!valid) {
            recordFailedAttempt(email);
            return null;
          }

          resetAttempts(email);

          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date(), loginCount: { increment: 1 } },
          }).catch(() => {});

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role.toLowerCase(),
            kyc: user.kyc,
            plan: user.plan.toLowerCase(),
          };
        } catch (err) {
          if (err instanceof Error && err.message.includes("tentatives")) throw err;
          if (err instanceof Error && err.message.includes("desactive")) throw err;
          console.error("[AUTH] Database error:", err);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  pages: {
    signIn: "/connexion",
    newUser: "/inscription",
    error: "/connexion",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user.role as string) ?? "freelance";
        token.kyc = (user.kyc as number) ?? 1;
        token.plan = (user.plan as string) ?? "gratuit";
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.kyc = token.kyc;
      session.user.plan = token.plan;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
