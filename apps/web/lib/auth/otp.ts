import crypto from "crypto";

/**
 * Préfixe de cloisonnement pour les codes de RÉINITIALISATION 2FA, rangés
 * dans la même table que l'OTP de connexion acheteur. Sans lui, un code émis
 * pour l'un des deux usages serait rejouable sur l'autre.
 */
export const PREFIXE_2FA_RESET = "2fa-reset:";

// Generate a 6-digit numeric OTP code
export function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

const IS_DEV_MODE = process.env.DEV_MODE === "true";
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

// ── In-memory fallback for dev mode (no DB needed) ──
const devOtpStore = new Map<string, { code: string; expiresAt: number; attempts: number }>();

// Store OTP for email (valid 10 minutes)
export async function storeOTP(email: string): Promise<string> {
  const code = generateOTP();
  const normalizedEmail = email.toLowerCase();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

  if (IS_DEV_MODE) {
    devOtpStore.set(normalizedEmail, { code, expiresAt: expiresAt.getTime(), attempts: 0 });
    console.log(`\n🔑 CODE OTP pour ${normalizedEmail}: ${code}\n`);
    return code;
  }

  // Production: store in database
  try {
    const prisma = (await import("@freelancehigh/db")).default;
    await prisma.otpCode.upsert({
      where: { email: normalizedEmail },
      update: { code, expiresAt, attempts: 0 },
      create: { email: normalizedEmail, code, expiresAt },
    });
  } catch (err) {
    console.error("[OTP] Failed to store OTP in DB, falling back to memory:", err);
    devOtpStore.set(normalizedEmail, { code, expiresAt: expiresAt.getTime(), attempts: 0 });
  }

  return code;
}

// Verify OTP for email
export async function verifyOTP(email: string, code: string): Promise<{ valid: boolean; error?: string }> {
  const normalizedEmail = email.toLowerCase();

  if (IS_DEV_MODE) {
    return verifyOTPInMemory(normalizedEmail, code);
  }

  try {
    const prisma = (await import("@freelancehigh/db")).default;
    const record = await prisma.otpCode.findUnique({ where: { email: normalizedEmail } });

    if (!record) {
      return { valid: false, error: "Code expiré ou introuvable. Demandez un nouveau code." };
    }

    if (new Date() > record.expiresAt) {
      await prisma.otpCode.delete({ where: { email: normalizedEmail } });
      return { valid: false, error: "Code expiré. Demandez un nouveau code." };
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      await prisma.otpCode.delete({ where: { email: normalizedEmail } });
      return { valid: false, error: "Trop de tentatives. Demandez un nouveau code." };
    }

    // Increment attempts
    await prisma.otpCode.update({
      where: { email: normalizedEmail },
      data: { attempts: { increment: 1 } },
    });

    // Constant-time comparison
    const isValid = crypto.timingSafeEqual(Buffer.from(code), Buffer.from(record.code));
    if (!isValid) {
      return { valid: false, error: "Code incorrect" };
    }

    // Valid — delete the OTP
    await prisma.otpCode.delete({ where: { email: normalizedEmail } });
    return { valid: true };
  } catch (err) {
    console.error("[OTP] DB error, falling back to memory:", err);
    return verifyOTPInMemory(normalizedEmail, code);
  }
}

// Delete expired OTPs (call periodically or on each request)
export async function cleanupExpiredOTPs(): Promise<void> {
  if (IS_DEV_MODE) {
    const now = Date.now();
    for (const [key, val] of devOtpStore.entries()) {
      if (now > val.expiresAt) devOtpStore.delete(key);
    }
    return;
  }

  try {
    const prisma = (await import("@freelancehigh/db")).default;
    await prisma.otpCode.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  } catch (err) {
    console.error("[OTP] Failed to cleanup expired OTPs:", err);
  }
}

// In-memory fallback
function verifyOTPInMemory(email: string, code: string): { valid: boolean; error?: string } {
  const record = devOtpStore.get(email);
  if (!record) {
    return { valid: false, error: "Code expiré ou introuvable. Demandez un nouveau code." };
  }
  if (Date.now() > record.expiresAt) {
    devOtpStore.delete(email);
    return { valid: false, error: "Code expiré. Demandez un nouveau code." };
  }
  if (record.attempts >= MAX_ATTEMPTS) {
    devOtpStore.delete(email);
    return { valid: false, error: "Trop de tentatives. Demandez un nouveau code." };
  }
  record.attempts++;

  const isValid = crypto.timingSafeEqual(Buffer.from(code), Buffer.from(record.code));
  if (!isValid) {
    return { valid: false, error: "Code incorrect" };
  }

  devOtpStore.delete(email);
  return { valid: true };
}
