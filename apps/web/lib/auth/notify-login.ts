/**
 * Fires on every successful authentication (credentials without 2FA,
 * OAuth without 2FA, or after 2FA TOTP verification).
 *
 * Responsibilities:
 *   1. Update User.lastLoginAt / lastLoginIp / loginCount
 *   2. Write a LoginAttempt row (audit trail)
 *   3. Send a login-alert email to the user (non-blocking)
 *
 * Never throws — failures are logged but don't block the login flow.
 */

import { sendLoginAlertEmail } from "@/lib/email";
import { lookupIp, formatLocation } from "./geo-lookup";
import type { ClientInfo } from "./client-info";

export async function notifyLoginSuccess(params: {
  userId: string;
  email: string;
  name: string | null;
  info: ClientInfo;
  method?: "credentials" | "google" | "linkedin";
}) {
  const { userId, email, name, info, method } = params;

  // 1 + 2. Update User + create LoginAttempt row (best-effort)
  try {
    const { prisma } = await import("@freelancehigh/db");
    await Promise.allSettled([
      prisma.user.update({
        where: { id: userId },
        data: {
          lastLoginAt: new Date(),
          lastLoginIp: info.ip,
          loginCount: { increment: 1 },
        },
      }),
      prisma.loginAttempt.create({
        data: {
          email,
          userId,
          ipAddress: info.ip,
          success: true,
        },
      }),
    ]);
  } catch (err) {
    console.error("[notifyLoginSuccess] DB update failed:", err);
  }

  // 3. Best-effort geo lookup to enrich the email with a city/country.
  let location: string | undefined;
  try {
    const geo = await lookupIp(info.ip);
    location = formatLocation({
      city: geo.city,
      region: geo.region,
      countryName: geo.countryName,
    });
  } catch { /* ignore */ }

  // 4. Fire email (don't block — user already has a session)
  sendLoginAlertEmail({
    email,
    name: name ?? "",
    ip: location ? `${info.ip} · ${location}` : info.ip,
    browser: info.browser,
    os: info.os,
    device: info.device,
    timestamp: new Date(),
    method,
  }).catch((err) => {
    console.error("[notifyLoginSuccess] Email send failed:", err);
  });
}
