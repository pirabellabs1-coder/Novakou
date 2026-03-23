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
            if (user.status.toUpperCase() !== "ACTIF") {
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

        // Read pending role + formations role from cookies (set before OAuth redirect)
        let pendingRole: string | undefined;
        let pendingFormationsRole: string | undefined;
        try {
          const { cookies } = await import("next/headers");
          const cookieStore = await cookies();
          pendingRole = cookieStore.get("pendingRole")?.value;
          pendingFormationsRole = cookieStore.get("pendingFormationsRole")?.value;
          if (pendingRole) {
            cookieStore.delete("pendingRole");
          }
          if (pendingFormationsRole) {
            cookieStore.delete("pendingFormationsRole");
          }
        } catch {
          // cookies() may not be available in all contexts
        }
        // Validate pendingRole — only accept known values
        const validRoles = ["freelance", "client", "agence"];
        if (pendingRole && !validRoles.includes(pendingRole)) {
          pendingRole = undefined;
        }

        if (IS_DEV_MODE) {
          try {
            const { devStore } = await import("./../../lib/dev/dev-store");
            const existing = devStore.findByEmail(email);
            if (!existing) {
              // Create a new user for OAuth with role from cookie (default: client)
              const oauthRole = (pendingRole || "client") as "freelance" | "client" | "agence" | "admin";
              const newUser = devStore.create({
                email,
                passwordHash: "", // OAuth users don't have a password
                name: user.name || email.split("@")[0],
                role: oauthRole,
                plan: "gratuit",
                kyc: 1,
                status: "ACTIF",
                ...(pendingFormationsRole ? { formationsRole: pendingFormationsRole } : {}),
              });
              user.id = newUser.id;
              user.role = oauthRole;
              user.kyc = 1;
              user.plan = "gratuit";
              if (pendingFormationsRole) user.formationsRole = pendingFormationsRole;

              // Send welcome email for new OAuth users
              import("@/lib/email").then(({ sendWelcomeEmail }) => {
                sendWelcomeEmail(email, user.name || email.split("@")[0]).catch((err) =>
                  console.error("[AUTH OAuth] Erreur envoi email bienvenue:", err)
                );
              });
            } else {
              user.id = existing.id;
              user.role = existing.role;
              user.kyc = existing.kyc;
              user.plan = existing.plan;
              const existingRecord = existing as unknown as Record<string, unknown>;
              // Use pending role if no formationsRole set yet, or update to new role
              const effectiveRole = pendingFormationsRole || (existingRecord.formationsRole as string | undefined);
              user.formationsRole = effectiveRole;
              if (pendingFormationsRole && existingRecord.formationsRole !== pendingFormationsRole) {
                devStore.update(existing.id, { formationsRole: pendingFormationsRole } as Record<string, unknown>);
              }
            }
          } catch (err) {
            console.error("[AUTH OAuth DEV]", err);
          }
        } else {
          try {
            const { prisma } = await import("@freelancehigh/db");
            let dbUser = await prisma.user.findUnique({ where: { email } });

            if (!dbUser) {
              // Create user with role + formationsRole from cookies
              const oauthRole = pendingRole || "client";
              const upperRole = oauthRole.toUpperCase() as "FREELANCE" | "CLIENT" | "AGENCE";
              dbUser = await prisma.user.create({
                data: {
                  email,
                  name: user.name || email.split("@")[0],
                  passwordHash: "", // OAuth users don't have a password
                  role: upperRole,
                  image: user.image,
                  emailVerified: new Date(),
                  ...(pendingFormationsRole ? { formationsRole: pendingFormationsRole } : {}),
                },
              });

              // Auto-create role-specific profile
              try {
                if (upperRole === "FREELANCE") {
                  await prisma.freelancerProfile.create({ data: { userId: dbUser.id } });
                } else if (upperRole === "CLIENT") {
                  await prisma.clientProfile.create({ data: { userId: dbUser.id } });
                } else if (upperRole === "AGENCE") {
                  await prisma.agencyProfile.create({ data: { userId: dbUser.id, agencyName: user.name || email.split("@")[0] } });
                }
              } catch (profileErr) {
                console.error("[AUTH OAuth] Auto-create profile error:", profileErr);
              }

              // Send welcome email for new OAuth users
              import("@/lib/email").then(({ sendWelcomeEmail }) => {
                sendWelcomeEmail(email, user.name || email.split("@")[0]).catch((err) =>
                  console.error("[AUTH OAuth] Erreur envoi email bienvenue:", err)
                );
              });
            } else if (pendingFormationsRole && dbUser.formationsRole !== pendingFormationsRole) {
              // Update formationsRole if user exists but role is different
              dbUser = await prisma.user.update({
                where: { id: dbUser.id },
                data: { formationsRole: pendingFormationsRole },
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
            user.formationsRole = dbUser.formationsRole?.toLowerCase();
          } catch (err) {
            console.error("[AUTH OAuth] Erreur DB lors du signIn OAuth:", err instanceof Error ? err.message : err);
            console.error("[AUTH OAuth] Stack:", err instanceof Error ? err.stack : "N/A");
            return false;
          }
        }
      }
      return true;
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user.role as string) ?? "client";
        token.kyc = (user.kyc as number) ?? 1;
        token.plan = (user.plan as string) ?? "gratuit";
        if (user.formationsRole) {
          token.formationsRole = user.formationsRole as string;
        }
      }

      // Refresh KYC level from DB when session is updated or periodically
      if (trigger === "update" || (token.id && !user)) {
        const now = Date.now();
        const lastRefresh = (token as Record<string, unknown>).kycRefreshedAt as number | undefined;
        // Force refresh immediately on explicit update(), otherwise every 5 minutes
        const shouldRefresh = trigger === "update" || !lastRefresh || now - lastRefresh > 5 * 60 * 1000;
        if (shouldRefresh) {
          try {
            if (IS_DEV_MODE) {
              const { devStore } = await import("../dev/dev-store");
              const dbUser = devStore.findById(token.id);
              if (dbUser) {
                token.kyc = dbUser.kyc;
                token.plan = dbUser.plan;
              }
            } else {
              const { prisma } = await import("@freelancehigh/db");
              const dbUser = await prisma.user.findUnique({
                where: { id: token.id },
                select: { kyc: true, plan: true },
              });
              if (dbUser) {
                token.kyc = dbUser.kyc;
                token.plan = dbUser.plan.toLowerCase();
              }
            }
            (token as Record<string, unknown>).kycRefreshedAt = now;
          } catch {
            // Silently fail — keep existing token values
          }
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
