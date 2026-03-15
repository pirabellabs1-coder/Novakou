import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import LinkedInProvider from "next-auth/providers/linkedin";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { checkRateLimit, recordFailedAttempt, resetAttempts } from "./rate-limiter";

// Types etendus pour le JWT et la session
declare module "next-auth" {
  interface User {
    role?: string;
    kyc?: number;
    plan?: string;
    formationsRole?: string;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      kyc: number;
      plan: string;
      formationsRole?: string;
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
    formationsRole?: string;
    twoFactorEnabled?: boolean;
  }
}

const IS_DEV_MODE = process.env.DEV_MODE === "true";

// Securite : le secret DOIT etre defini en production
function getAuthSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("NEXTAUTH_SECRET est obligatoire en production. Impossible de demarrer sans.");
  }
  if (!secret) {
    console.warn("[AUTH] NEXTAUTH_SECRET non defini — utilisation d'un secret de dev uniquement");
    return "dev-only-secret-not-for-production";
  }
  return secret;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
        twoFactorToken: { label: "2FA Token", type: "text" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;
        const twoFactorToken = credentials?.twoFactorToken as string | undefined;

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
            // Verifier si 2FA est active — valider le token HMAC signe par le serveur
            const userRecord = user as unknown as Record<string, unknown>;
            if (userRecord.twoFactorEnabled) {
              if (!twoFactorToken) {
                throw new Error("REQUIRES_2FA");
              }
              const secret = getAuthSecret();
              const now = Date.now().toString().slice(0, -4);
              const prev = (Date.now() - 10000).toString().slice(0, -4);
              const validToken1 = crypto.createHmac("sha256", secret).update(`${email}:${now}`).digest("hex");
              const validToken2 = crypto.createHmac("sha256", secret).update(`${email}:${prev}`).digest("hex");

              if (
                !crypto.timingSafeEqual(Buffer.from(twoFactorToken), Buffer.from(validToken1)) &&
                !crypto.timingSafeEqual(Buffer.from(twoFactorToken), Buffer.from(validToken2))
              ) {
                throw new Error("REQUIRES_2FA");
              }
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
              formationsRole: userRecord.formationsRole as string | undefined,
            };
          } catch (err) {
            if (err instanceof Error && (err.message.includes("tentatives") || err.message.includes("desactive") || err.message === "REQUIRES_2FA")) throw err;
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
              twoFactorEnabled: true,
              formationsRole: true,
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

          // Verifier si 2FA est active — valider le token HMAC signe par le serveur
          if (user.twoFactorEnabled) {
            if (!twoFactorToken) {
              throw new Error("REQUIRES_2FA");
            }
            const secret = getAuthSecret();
            const now = Date.now().toString().slice(0, -4);
            const prev = (Date.now() - 10000).toString().slice(0, -4);
            const validToken1 = crypto.createHmac("sha256", secret).update(`${email}:${now}`).digest("hex");
            const validToken2 = crypto.createHmac("sha256", secret).update(`${email}:${prev}`).digest("hex");

            if (
              !crypto.timingSafeEqual(Buffer.from(twoFactorToken), Buffer.from(validToken1)) &&
              !crypto.timingSafeEqual(Buffer.from(twoFactorToken), Buffer.from(validToken2))
            ) {
              throw new Error("REQUIRES_2FA");
            }
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
            formationsRole: user.formationsRole?.toLowerCase(),
          };
        } catch (err) {
          if (err instanceof Error && err.message.includes("tentatives")) throw err;
          if (err instanceof Error && err.message.includes("desactive")) throw err;
          if (err instanceof Error && err.message === "REQUIRES_2FA") throw err;
          console.error("[AUTH] Database error:", err);
          return null;
        }
      },
    }),
    // OAuth providers
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    ...(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET
      ? [
          LinkedInProvider({
            clientId: process.env.LINKEDIN_CLIENT_ID,
            clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours for financial platform security
  },
  pages: {
    signIn: "/connexion",
    newUser: "/inscription",
    error: "/connexion",
  },
  callbacks: {
    async signIn({ user, account }) {
      // OAuth providers: create or link user in DB/devStore
      if (account && account.provider !== "credentials") {
        const email = user.email;
        if (!email) return false;

        if (IS_DEV_MODE) {
          try {
            const { devStore } = await import("./../../lib/dev/dev-store");
            const existing = devStore.findByEmail(email);
            if (!existing) {
              // Create a new user for OAuth
              const newUser = devStore.create({
                email,
                passwordHash: "", // OAuth users don't have a password
                name: user.name || email.split("@")[0],
                role: "freelance",
                plan: "gratuit",
                kyc: 1,
                status: "ACTIF",
              });
              user.id = newUser.id;
              user.role = "freelance";
              user.kyc = 1;
              user.plan = "gratuit";
            } else {
              user.id = existing.id;
              user.role = existing.role;
              user.kyc = existing.kyc;
              user.plan = existing.plan;
              user.formationsRole = (existing as unknown as Record<string, unknown>).formationsRole as string | undefined;
            }
          } catch (err) {
            console.error("[AUTH OAuth DEV]", err);
          }
        } else {
          try {
            const { prisma } = await import("@freelancehigh/db");
            let dbUser = await prisma.user.findUnique({ where: { email } });

            if (!dbUser) {
              // Create user
              dbUser = await prisma.user.create({
                data: {
                  email,
                  name: user.name || email.split("@")[0],
                  passwordHash: "", // OAuth users don't have a password
                  image: user.image,
                  emailVerified: new Date(),
                },
              });
            }

            // Upsert account link
            await prisma.account.upsert({
              where: {
                provider_providerAccountId: {
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                },
              },
              update: {
                access_token: account.access_token as string | undefined,
                refresh_token: account.refresh_token as string | undefined,
                expires_at: account.expires_at as number | undefined,
              },
              create: {
                userId: dbUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                access_token: account.access_token as string | undefined,
                refresh_token: account.refresh_token as string | undefined,
                expires_at: account.expires_at as number | undefined,
                token_type: account.token_type as string | undefined,
                scope: account.scope as string | undefined,
                id_token: account.id_token as string | undefined,
              },
            });

            user.id = dbUser.id;
            user.role = dbUser.role.toLowerCase();
            user.kyc = dbUser.kyc;
            user.plan = dbUser.plan.toLowerCase();
          } catch (err) {
            console.error("[AUTH OAuth]", err);
            return false;
          }
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user.role as string) ?? "freelance";
        token.kyc = (user.kyc as number) ?? 1;
        token.plan = (user.plan as string) ?? "gratuit";
        if (user.formationsRole) {
          token.formationsRole = user.formationsRole as string;
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.kyc = token.kyc;
      session.user.plan = token.plan;
      if (token.formationsRole) {
        session.user.formationsRole = token.formationsRole;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
