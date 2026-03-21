/**
 * Dev User Store — stockage JSON local pour développement sans base de données.
 * Activé quand DEV_MODE=true dans .env.local
 * Fichier de données : lib/dev/users.json (gitignored)
 */

import fs from "fs";
import path from "path";

export interface DevUser {
  id: string;
  email: string;
  passwordHash: string; // bcrypt hash
  name: string;
  role: "freelance" | "client" | "agence" | "admin";
  plan: string;
  kyc: number;
  status: string;
  createdAt: string;
  loginCount: number;
  lastLoginAt?: string;
  country?: string;
  adminRole?: "super_admin" | "moderateur" | "validateur_kyc" | "analyste" | "support" | "financier";
  formationsRole?: "apprenant" | "instructeur";
}

// __dirname est fiable en serverless (Vercel) contrairement à process.cwd()
const DB_PATH = path.join(__dirname, "..", "..", "lib", "dev", "users.json");
const DB_PATH_ALT = path.join(process.cwd(), "lib", "dev", "users.json");

function getDbPath(): string {
  // Try __dirname first (works on Vercel serverless), fallback to cwd
  if (fs.existsSync(DB_PATH)) return DB_PATH;
  if (fs.existsSync(DB_PATH_ALT)) return DB_PATH_ALT;
  // Last resort: try apps/web relative path (monorepo root)
  const monorepoPath = path.join(process.cwd(), "apps", "web", "lib", "dev", "users.json");
  if (fs.existsSync(monorepoPath)) return monorepoPath;
  return DB_PATH_ALT; // default, will create if missing
}

// Hash bcrypt de "FH@dmin2026!Secure#"
const ADMIN_HASH = "$2b$12$v/KE9UBiaJO5xpyOrsltO.t8nM92aFJRgEBHD/E03rxrUY0325O3.";

const DEFAULT_USERS: DevUser[] = [
  { id: "dev-admin-1", email: "admin@freelancehigh.com", passwordHash: ADMIN_HASH, name: "Admin FreelanceHigh", role: "admin", plan: "business", kyc: 4, status: "ACTIF", createdAt: "2026-01-01T00:00:00.000Z", loginCount: 0, country: "FR", adminRole: "super_admin", formationsRole: "instructeur" },
];

const IS_VERCEL = !!process.env.VERCEL;
let usersCache: DevUser[] | null = null;

function readUsers(): DevUser[] {
  if (usersCache) return usersCache;
  try {
    const dbPath = getDbPath();
    if (!fs.existsSync(dbPath)) {
      usersCache = DEFAULT_USERS;
      if (!IS_VERCEL) writeUsers(DEFAULT_USERS);
      return DEFAULT_USERS;
    }
    const raw = fs.readFileSync(dbPath, "utf-8");
    usersCache = JSON.parse(raw) as DevUser[];
    return usersCache;
  } catch {
    usersCache = DEFAULT_USERS;
    return DEFAULT_USERS;
  }
}

function writeUsers(users: DevUser[]): void {
  usersCache = users;
  if (IS_VERCEL) return; // read-only filesystem
  try {
    const dbPath = getDbPath();
    fs.writeFileSync(dbPath, JSON.stringify(users, null, 2), "utf-8");
  } catch {
    // Ignore write errors
  }
}

export const devStore = {
  getAll(): DevUser[] {
    return readUsers();
  },

  findByEmail(email: string): DevUser | null {
    const users = readUsers();
    return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
  },

  findById(id: string): DevUser | null {
    const users = readUsers();
    return users.find((u) => u.id === id) ?? null;
  },

  create(data: Omit<DevUser, "id" | "createdAt" | "loginCount">): DevUser {
    const users = readUsers();
    const newUser: DevUser = {
      ...data,
      id: `dev-${Date.now()}`,
      createdAt: new Date().toISOString(),
      loginCount: 0,
    };
    users.push(newUser);
    writeUsers(users);
    return newUser;
  },

  update(id: string, updates: Partial<Omit<DevUser, "id">>): DevUser | null {
    const users = readUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    users[idx] = { ...users[idx], ...updates };
    writeUsers(users);
    return users[idx];
  },

  updateLastLogin(id: string): void {
    const users = readUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx !== -1) {
      users[idx].lastLoginAt = new Date().toISOString();
      users[idx].loginCount = (users[idx].loginCount ?? 0) + 1;
      writeUsers(users);
    }
  },
};
