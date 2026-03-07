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
}

const DB_PATH = path.join(process.cwd(), "lib", "dev", "users.json");

// Comptes de test pré-créés (mot de passe : Test1234! pour tous)
// Hash bcrypt de "Test1234!" avec saltRounds=12
const BCRYPT_HASH = "$2b$12$eZw2Zre.jn/hIW2ufWpkfuGOzpur/UE/lOFHUam3kazRFvyjU75vS";

const DEFAULT_USERS: DevUser[] = [
  {
    id: "dev-freelance-1",
    email: "freelance@test.com",
    passwordHash: BCRYPT_HASH,
    name: "Jean Dupont",
    role: "freelance",
    plan: "gratuit",
    kyc: 1,
    status: "ACTIF",
    createdAt: new Date().toISOString(),
    loginCount: 0,
  },
  {
    id: "dev-client-1",
    email: "client@test.com",
    passwordHash: BCRYPT_HASH,
    name: "Marie Martin",
    role: "client",
    plan: "gratuit",
    kyc: 1,
    status: "ACTIF",
    createdAt: new Date().toISOString(),
    loginCount: 0,
  },
  {
    id: "dev-agence-1",
    email: "agence@test.com",
    passwordHash: BCRYPT_HASH,
    name: "Tech Agency",
    role: "agence",
    plan: "agence",
    kyc: 2,
    status: "ACTIF",
    createdAt: new Date().toISOString(),
    loginCount: 0,
  },
  {
    id: "dev-admin-1",
    email: "admin@test.com",
    passwordHash: BCRYPT_HASH,
    name: "Admin FreelanceHigh",
    role: "admin",
    plan: "business",
    kyc: 4,
    status: "ACTIF",
    createdAt: new Date().toISOString(),
    loginCount: 0,
  },
];

function readUsers(): DevUser[] {
  try {
    if (!fs.existsSync(DB_PATH)) {
      writeUsers(DEFAULT_USERS);
      return DEFAULT_USERS;
    }
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    return JSON.parse(raw) as DevUser[];
  } catch {
    return DEFAULT_USERS;
  }
}

function writeUsers(users: DevUser[]): void {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2), "utf-8");
  } catch {
    // Ignore write errors in dev
  }
}

export const devStore = {
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
