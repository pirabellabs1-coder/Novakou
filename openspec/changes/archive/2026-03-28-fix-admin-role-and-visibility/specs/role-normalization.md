# Spec: Admin Role Normalization

The session role must be normalized to lowercase so all admin route checks work consistently.

## Root cause
- Prisma stores role as UPPERCASE enum: "ADMIN", "FREELANCE", "CLIENT", "AGENCE"
- JWT callback sets `token.role = user.role` without lowercasing
- Admin routes check `session.user.role !== "admin"` (lowercase)
- Result: all admin routes return 403

## Fix
- In `lib/auth/config.ts` JWT callback: lowercase the role
- Additionally fix all admin route role checks to be case-insensitive as safety net
