import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import LinkedInProvider from "next-auth/providers/linkedin";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { checkRateLimit, recordFailedAttempt, resetAttempts } from "./rate-limiter";

// Map legacy plan names to new elevation plan names
const PLAN_NAME_MAP: Record<string, string> = {
  gratuit: "decouverte", free: "decouverte",
  pro: "ascension",
  business: "sommet",
  agence: "empire", agency: "empire",
  // New names pass through
  decouverte: "decouverte", ascension: "ascension", sommet: "sommet", empire: "empire",
};
function mapPlanName(plan: string): string {
  return PLAN_NAME_MAP[plan] || "decouverte";
}

// Types etendus pour le JWT et la session
declare module "next-auth" {
  interface User {
    role?: string;
    kyc?: number;
    plan?: string;
    formationsRole?: string;
    adminRole?: string;
    twoFactorEnabled?: boolean;
    // Signal from authorize() / signIn callback that a 2FA verification step
    // is still required before the user can access protected routes.
    requires2FA?: boolean;
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
      adminRole?: string;
      image?: string | null;
      tfaPending?: boolean;
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
    adminRole?: string;
    twoFactorEnabled?: boolean;
    // True when the user signed in but still needs to enter their 2FA code.
    // Middleware blocks dashboards while this is true.
    tfaPending?: boolean;
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
            // 2FA : on laisse l'utilisateur se connecter, mais on marque
            // la session comme "tfaPending" jusqu'à la validation du code TOTP
            // via /2fa (middleware bloque les dashboards en attendant).
            const userRecord = user as unknown as Record<string, unknown>;
            const twoFactorEnabled = !!userRecord.twoFactorEnabled;

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
              twoFactorEnabled,
              requires2FA: twoFactorEnabled,
            };
          } catch (err) {
            if (err instanceof Error && (err.message.includes("tentatives") || err.message.includes("desactive") || err.message === "REQUIRES_2FA" || err.message === "INVALID_2FA_TOKEN")) throw err;
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
              emailVerified: true,
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

          // Bloquer la connexion si email non vérifié — l'utilisateur doit valider via OTP
          if (!user.emailVerified) {
            throw new Error("EMAIL_NOT_VERIFIED");
          }

          resetAttempts(email);

          // 2FA : on ne bloque pas l'authentification ici ; le JWT portera un
          // flag tfaPending et le middleware redirigera vers /2fa.
          // L'email d'alerte de connexion est envoyé soit immédiatement (pas de 2FA),
          // soit après la validation du code TOTP.
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: (user.role || "FREELANCE").toLowerCase(),
            kyc: user.kyc,
            plan: mapPlanName(((user.plan as string) || "gratuit").toLowerCase()),
            formationsRole: user.formationsRole?.toLowerCase() as string | undefined,
            twoFactorEnabled: !!user.twoFactorEnabled,
            requires2FA: !!user.twoFactorEnabled,
          };
        } catch (err) {
          if (err instanceof Error && err.message.includes("tentatives")) throw err;
          if (err instanceof Error && err.message.includes("desactive")) throw err;
          if (err instanceof Error && err.message === "REQUIRES_2FA") throw err;
          if (err instanceof Error && err.message === "EMAIL_NOT_VERIFIED") throw err;
          console.error("[AUTH] Database error:", err);
          return null;
        }
      },
    }),

    // ── Provider dédié ACHETEURS : login par email + OTP (sans password) ──
    // Utilisé par /acheteur/connexion. L'OTP est envoyé par email via
    // /api/auth/buyer/send-otp puis vérifié ici.
    CredentialsProvider({
      id: "buyer-otp",
      name: "Acheteur OTP",
      credentials: {
        email: { label: "Email", type: "email" },
        otpCode: { label: "Code OTP", type: "text" },
      },
      async authorize(credentials) {
        const email = (credentials?.email as string)?.toLowerCase().trim();
        const otpCode = (credentials?.otpCode as string)?.trim();
        if (!email || !otpCode) return null;

        const { verifyOTP } = await import("./otp");
        const result = await verifyOTP(email, otpCode);
        if (!result.valid) {
          throw new Error(result.error || "Code OTP invalide");
        }

        // Find or create user (guest checkout → on crée un compte light)
        try {
          const { prisma } = await import("@freelancehigh/db");
          let user = await prisma.user.findUnique({
            where: { email },
            select: {
              id: true, email: true, name: true, role: true, kyc: true, plan: true,
              status: true, formationsRole: true,
            },
          });
          if (!user) {
            // Guest user qui vient d'acheter → on crée son compte
            const created = await prisma.user.create({
              data: {
                email,
                name: email.split("@")[0],
                passwordHash: "", // login par OTP uniquement
                role: "CLIENT",
                status: "ACTIF",
                emailVerified: new Date(),
                formationsRole: "apprenant",
              },
              select: {
                id: true, email: true, name: true, role: true, kyc: true, plan: true,
                status: true, formationsRole: true,
              },
            });
            user = created;
          }
          if (user.status !== "ACTIF") {
            throw new Error("Votre compte est desactive.");
          }
          return {
            id: user.id,
            email: user.email,
            name: user.name || email.split("@")[0],
            role: (user.role ?? "CLIENT").toLowerCase(),
            kyc: user.kyc ?? 1,
            plan: mapPlanName(((user.plan as string) || "gratuit").toLowerCase()),
            formationsRole: user.formationsRole?.toLowerCase() || "apprenant",
            twoFactorEnabled: false,
            requires2FA: false,
          };
        } catch (err) {
          console.error("[AUTH buyer-otp]", err);
          if (err instanceof Error && err.message.includes("desactive")) throw err;
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
              // Create a new user for OAuth — formations users get role "client" to avoid marketplace pollution
              const oauthRole = pendingFormationsRole
                ? ("client" as const)
                : ((pendingRole || "client") as "freelance" | "client" | "agence" | "admin");
              const newUser = devStore.create({
                email,
                passwordHash: "", // OAuth users don't have a password
                name: user.name || email.split("@")[0],
                role: oauthRole,
                plan: "gratuit",
                kyc: 1,
                status: "ACTIF",
                ...(pendingFormationsRole ? { formationsRole: pendingFormationsRole as "instructeur" | "apprenant" } : {}),
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
              const currentFormationsRole = existingRecord.formationsRole as string | undefined;
              const tfa = !!existingRecord.twoFactorEnabled;
              user.twoFactorEnabled = tfa;
              user.requires2FA = tfa;

              // Reject if user has a DIFFERENT formationsRole (can't be both instructeur and apprenant)
              if (pendingFormationsRole && currentFormationsRole && currentFormationsRole !== pendingFormationsRole) {
                console.warn(`[AUTH OAuth DEV] Role conflict: ${email} is ${currentFormationsRole}, tried ${pendingFormationsRole}`);
                return false;
              }

              const effectiveRole = pendingFormationsRole || currentFormationsRole;
              user.formationsRole = effectiveRole;
              if (pendingFormationsRole && !currentFormationsRole) {
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
              // Create user — formations users get role CLIENT to avoid marketplace pollution
              const isFormations = !!pendingFormationsRole;
              const oauthRole = isFormations ? "client" : (pendingRole || "client");
              const upperRole = oauthRole.toUpperCase() as "FREELANCE" | "CLIENT" | "AGENCE";
              dbUser = await prisma.user.create({
                data: {
                  email,
                  name: user.name || email.split("@")[0],
                  passwordHash: "", // OAuth users don't have a password
                  role: upperRole,
                  image: user.image,
                  emailVerified: new Date(),
                  ...(pendingFormationsRole ? { formationsRole: pendingFormationsRole as string } : {}),
                  registrationSource: isFormations ? "formations" : "marketplace",
                },
              });

              // Auto-create role-specific profile — skip for formations-only users
              if (!isFormations) {
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
              }

              // Auto-create instructeur profile + primary boutique for OAuth vendor signups
              if (pendingFormationsRole === "instructeur") {
                try {
                  const instProfile = await prisma.instructeurProfile.upsert({
                    where: { userId: dbUser.id },
                    update: {},
                    create: { userId: dbUser.id, status: "EN_ATTENTE" },
                  });
                  const baseName = user.name || email.split("@")[0];
                  const baseSlug = baseName
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-|-$/g, "")
                    .slice(0, 30) || "boutique";
                  const slug = `${baseSlug}-${Date.now().toString(36)}`;
                  await prisma.vendorShop.create({
                    data: {
                      instructeurId: instProfile.id,
                      name: baseName,
                      slug,
                      isPrimary: true,
                    },
                  });
                } catch (shopErr) {
                  console.error("[AUTH OAuth] Auto-create instructeur+shop error:", shopErr);
                }
              }

              // Send welcome email for new OAuth users
              import("@/lib/email").then(({ sendWelcomeEmail }) => {
                sendWelcomeEmail(email, user.name || email.split("@")[0]).catch((err) =>
                  console.error("[AUTH OAuth] Erreur envoi email bienvenue:", err)
                );
              });
            } else if (pendingFormationsRole) {
              // Reject if user has a DIFFERENT formationsRole (can't be both instructeur and apprenant)
              if (dbUser.formationsRole && dbUser.formationsRole !== pendingFormationsRole) {
                console.warn(`[AUTH OAuth] Role conflict: ${email} is ${dbUser.formationsRole}, tried ${pendingFormationsRole}`);
                return false;
              }
              // Set formationsRole if not yet set
              if (!dbUser.formationsRole) {
                dbUser = await prisma.user.update({
                  where: { id: dbUser.id },
                  data: { formationsRole: pendingFormationsRole },
                });
              }
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
            user.formationsRole = dbUser.formationsRole?.toLowerCase() as string | undefined;
            user.twoFactorEnabled = !!dbUser.twoFactorEnabled;
            user.requires2FA = !!dbUser.twoFactorEnabled;
          } catch (err) {
            console.error("[AUTH OAuth] Erreur DB lors du signIn OAuth:", err instanceof Error ? err.message : err);
            console.error("[AUTH OAuth] Stack:", err instanceof Error ? err.stack : "N/A");
            return false;
          }
        }
      }
      return true;
    },
    async jwt({ token, user, account, trigger, session }) {
      if (user) {
        token.id = user.id as string;
        token.role = ((user.role as string) ?? "client").toLowerCase();
        token.kyc = (user.kyc as number) ?? 1;
        token.plan = mapPlanName(((user.plan as string) ?? "gratuit").toLowerCase());
        if (user.formationsRole) {
          token.formationsRole = user.formationsRole as string;
        }
        // Admin sub-role: default to super_admin for backward compatibility
        if (token.role === "admin") {
          token.adminRole = (user.adminRole as string) || "super_admin";
        }

        // 2FA flag. Set once on initial sign-in; cleared by explicit `update()`
        // after /2fa verification succeeds.
        token.twoFactorEnabled = !!user.twoFactorEnabled;
        token.tfaPending = !!user.requires2FA;

        // Fire login-alert email if no 2FA pending (otherwise it fires
        // later from /api/auth/verify-2fa after the code is entered).
        if (trigger === "signIn" && !token.tfaPending && user.id && user.email) {
          try {
            const [{ getClientInfoFromContext }, { notifyLoginSuccess }] = await Promise.all([
              import("./client-info"),
              import("./notify-login"),
            ]);
            const info = await getClientInfoFromContext();
            const method = (account?.provider as "google" | "linkedin" | "credentials" | undefined) ?? "credentials";
            notifyLoginSuccess({
              userId: user.id as string,
              email: user.email as string,
              name: (user.name as string) ?? null,
              info,
              method,
            }).catch(() => null);
          } catch { /* best-effort */ }
        }
      }

      // The /2fa page calls `update({ tfaVerified: true })` after a valid
      // TOTP code. Clear the pending flag on the next JWT pass.
      if (trigger === "update" && (session as { tfaVerified?: boolean } | undefined)?.tfaVerified === true) {
        token.tfaPending = false;
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
                token.plan = mapPlanName(dbUser.plan);
                if (token.role === "admin") {
                  token.adminRole = dbUser.adminRole || "super_admin";
                }
              }
            } else if (token.id) {
              const { prisma } = await import("@freelancehigh/db");
              const dbUser = await prisma.user.findUnique({
                where: { id: token.id },
                select: { kyc: true, plan: true, role: true },
              });
              if (dbUser) {
                token.kyc = dbUser.kyc;
                token.plan = mapPlanName(dbUser.plan.toLowerCase());
                if (token.role === "admin" || dbUser.role === "ADMIN") {
                  token.adminRole = "super_admin";
                }
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
      if (token.adminRole) {
        session.user.adminRole = token.adminRole;
      }
      // Expose the pending-2FA flag so middleware + client can gate access.
      session.user.tfaPending = !!token.tfaPending;
      return session;
    },
  },
  secret: getAuthSecret(),
};
