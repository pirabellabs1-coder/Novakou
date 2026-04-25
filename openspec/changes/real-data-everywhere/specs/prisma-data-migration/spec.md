## prisma-data-migration

### Requirements

1. All API routes MUST have a production-ready Prisma path gated by `if (IS_DEV && !USE_PRISMA_FOR_DATA) { dev-store } else { Prisma }`
2. No page or component may import runtime data from `lib/demo-data.ts` (type-only imports are OK)
3. Dashboard Zustand store MUST NOT initialize with non-empty hardcoded arrays (notification settings, availability)
4. CategoryBar MUST load categories from API with static fallback
5. All Prisma queries MUST be wrapped in try/catch with graceful degradation

### Routes requiring Prisma path addition

| Route | Method | Priority |
|-------|--------|----------|
| `/api/search` | GET | HIGH |
| `/api/invoices` | GET | HIGH |
| `/api/invoices/[id]/pdf` | GET | HIGH |
| `/api/rank` | GET | MEDIUM |
| `/api/admin/boosts` | GET/POST | HIGH |
| `/api/admin/badges` | GET | MEDIUM |
| `/api/admin/users/search` | GET | HIGH |
| `/api/payments/cinetpay` | POST | CRITICAL |
| `/api/webhooks/cinetpay` | POST | CRITICAL |
| `/api/services/[id]/toggle` | PATCH | HIGH |
| `/api/cron/deadline-reminder` | GET | MEDIUM |
| `/api/contact` | POST | MEDIUM |
| `/api/downloads` | GET | MEDIUM |
| `/api/auth/setup-2fa` | POST | HIGH |
| `/api/auth/verify-2fa` | POST | HIGH |
| `/api/auth/update-formations-role` | POST | MEDIUM |

### Acceptance criteria

- Zero API routes import from dev-stores without the `IS_DEV && !USE_PRISMA_FOR_DATA` guard
- `DEMO_NOTIFICATION_SETTINGS` and `DEMO_AVAILABILITY` removed from dashboard store initial state
- `INVOICES` import removed from abonnement page, replaced with API fetch
- CategoryBar fetches from `/api/public/categories` or falls back to static list
- All existing dev-mode functionality preserved (no regression for local dev)
