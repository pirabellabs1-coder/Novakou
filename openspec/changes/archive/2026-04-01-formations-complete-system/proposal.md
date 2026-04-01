## Why

The formations module has 23 Prisma models, 55+ API routes, and 70+ frontend pages already built, but many routes still use dev stores (mock data) instead of Prisma, the cart-to-checkout-to-enrollment pipeline isn't fully wired end-to-end, instructor/admin dashboard stats are hardcoded, and data synchronization between operations (purchase → enrollment → stats update) has gaps. Users cannot complete a real purchase flow or see real computed statistics. This change makes the entire formations system functional with real database operations.

**Version cible**: MVP (M1-3)

**Impact sur les rôles**:
- **Client/Apprenant**: Can browse, purchase, learn, get certificates with real data
- **Instructeur**: Dashboard shows real revenue, students, ratings computed from DB
- **Admin**: Can manage formations, see real platform stats, handle refunds

## What Changes

- **Cart & Checkout Pipeline**: Wire cart API routes to Prisma (add/remove items, apply promo codes, calculate totals), connect to Stripe checkout, create enrollments on payment success, clear cart post-purchase
- **Enrollment & Progress Tracking**: Ensure enrollment creation triggers stat updates (studentsCount, totalRevenue on Formation), lesson progress updates enrollment progress %, completion triggers certificate issuance
- **Favorites System**: Wire favorites API to Prisma (toggle on/off, list user favorites), reflect state in formation detail pages
- **Promo Code Validation**: Full validation logic (active, date range, usage limits, applicable formations), cart total recalculation on apply/remove
- **Certificate Auto-Generation**: On 100% completion, auto-issue certificate with unique code, generate PDF
- **Instructor Dashboard Real Stats**: Replace hardcoded stats with Prisma aggregations (COUNT enrollments, AVG rating, SUM revenue per formation)
- **Admin Dashboard Real Stats**: Platform-wide aggregations from real data
- **API Route Prisma Migration**: Audit all 55+ routes, replace any remaining dev store usage with Prisma queries
- **Data Synchronization**: Ensure all mutations invalidate relevant TanStack Query caches for instant UI updates

## Capabilities

### New Capabilities
- `cart-checkout-pipeline`: End-to-end cart management, promo code application, Stripe checkout session creation, post-payment enrollment creation, and cart cleanup
- `formation-stats-sync`: Real-time stat computation (students count, revenue, average rating) from DB aggregations, triggered on enrollment/review creation
- `enrollment-lifecycle`: Complete enrollment lifecycle from purchase through lesson progress tracking to certificate auto-issuance on completion

### Modified Capabilities
<!-- No existing openspec specs to modify -->

## Impact

- **Schema**: No new models needed (all 23 exist). Minor field additions possible (e.g., computed stat triggers)
- **API Routes**: ~15-20 routes need Prisma migration or logic fixes (cart, checkout, favorites, stats endpoints)
- **Frontend**: Cart page, checkout flow, formation detail (enrollment check, favorite toggle), instructor dashboard, admin dashboard need real data wiring
- **Dependencies**: Stripe SDK (already installed), Prisma client (already configured)
- **Jobs**: Certificate PDF generation may need BullMQ worker for async processing
- **Email**: Purchase confirmation email template via Resend (React Email)
