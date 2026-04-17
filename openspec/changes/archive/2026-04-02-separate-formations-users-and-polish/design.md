## Context

FreelanceHigh has two distinct platforms sharing one User table:
1. **Marketplace** — freelancers sell services, clients buy (roles: FREELANCE, CLIENT, AGENCE)
2. **Formations** — learners take courses, instructors teach (formationsRole: apprenant, instructeur)

The problem: when someone registers through `/inscription`, the code hardcodes `role: "freelance"` in the register API call. This creates a User record that looks identical to a real marketplace freelancer, polluting admin dashboards and user statistics.

**Current registration flow:**
```
/formations/inscription → POST /api/auth/register
  body: { role: "freelance", formationsRole: "apprenant" }
  → Creates User { role: FREELANCE, formationsRole: "apprenant" }
  → Also creates FreelancerProfile (wrong!)
```

**Current admin query:**
```
/api/admin/users → SELECT * FROM User WHERE role != 'ADMIN'
  → Returns ALL users including formation-only users
```

## Goals / Non-Goals

**Goals:**
- Formation-only users are invisible in the marketplace admin panel
- Marketplace-only users are invisible in the formations admin panel
- Admin can see both worlds via their respective admin sections
- Registration source is tracked to allow future analytics
- FormationCard and homepage get a visual refresh with brand consistency
- Zero data loss — existing users keep working

**Non-Goals:**
- Refactoring the entire admin dashboard layout
- Changing the formations admin sidebar structure
- Adding new admin pages beyond what's needed for user separation
- Redesigning the marketplace cards or homepage
- Changing the formations explorer/filter page design

## Decisions

### Decision 1: Add `registrationSource` field instead of new UserRole enum

**Choice**: Add a nullable `registrationSource` field (`"marketplace"` | `"formations"` | null) to the User model. Keep the existing `role` enum unchanged.

**Rationale**: Adding a new `UserRole` value like `APPRENANT` would break the existing middleware, role-based routing, and dozens of role checks throughout the codebase. A separate tracking field is non-breaking and only affects the admin filter logic.

**Alternative rejected**: New `UserRole.APPRENANT` — too invasive, breaks `ROLE_ROUTES`, `ROLE_DASHBOARD`, and all `role === "freelance"` checks.

### Decision 2: Registration from formations uses `role: "client"` + `registrationSource: "formations"`

**Choice**: Formation-only users get `role: CLIENT` (the least-privileged marketplace role) instead of `FREELANCE`. Combined with `registrationSource: "formations"`, the admin API can exclude them.

**Rationale**: `CLIENT` is the safest default — these users won't appear as freelancers in the marketplace, won't have services or a FreelancerProfile created. If they later want to sell on the marketplace, they can upgrade their role.

The inscription page will send `role: "client"` instead of `role: "freelance"`.

### Decision 3: Admin user API filters by registrationSource

**Choice**: `/api/admin/users` adds `WHERE registrationSource != 'formations' OR registrationSource IS NULL` to exclude formation-only users. The formations admin gets a separate API for its users.

**Approach**:
- Marketplace admin: `registrationSource IN (null, 'marketplace')` + `role != ADMIN`
- Formations admin: `formationsRole IS NOT NULL` OR `registrationSource = 'formations'`

### Decision 4: FormationCard visual refresh — subtle premium polish

**Choice**: Keep the current structure but refine visual details: better shadows, refined typography hierarchy, subtle gradient overlays on thumbnails, cleaner badge positioning, and brand-aligned colors.

**Not a full rewrite** — the current FormationCard is well-built (272 lines, grid/list/compact modes, hover preview). The refresh focuses on:
- Thumbnail overlay gradient for better text contrast
- Refined shadow depth (`shadow-sm` → `shadow-md` on hover → `shadow-xl`)
- Brand-colored accent bar on cards
- Improved instructor section with better avatar styling
- Cleaner price display with more prominent styling

### Decision 5: Homepage hero refinement

**Choice**: Keep the current hero structure but make it more impactful:
- Larger typography with better line-height
- Refined gradient colors (match indigo/violet brand)
- Animated decorative elements
- Improved stats block with glassmorphism
- Better section spacing

## Risks / Trade-offs

**Risk**: Existing formation users have `role: FREELANCE` and `registrationSource: null`.
→ **Mitigation**: Migration script updates existing users: any User with `formationsRole IS NOT NULL` and `role = FREELANCE` and no FreelancerProfile data gets `registrationSource: 'formations'` and `role: CLIENT`.

**Risk**: Changing `role` from FREELANCE to CLIENT for existing formation users could break their session JWT.
→ **Mitigation**: Next login refreshes the JWT token (jwt callback already re-fetches from DB every 5 minutes). Worst case: user logs out and back in.

**Risk**: Design changes may not match user expectations.
→ **Mitigation**: Changes are incremental polish, not a full redesign. Keep what works, refine details.
