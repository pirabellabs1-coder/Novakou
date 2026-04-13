# Skill: FreelanceHigh Email Template Builder

Create transactional email templates using the project's HTML email system with dark theme and i18n.

## Trigger
Use when the user asks to create an email, add a notification email, build an email template, or implement email sending.

## Instructions

### Step 1: Check existing templates
```bash
ls apps/web/lib/email/templates/
```
Existing template categories: admin, agency, formation, kyc, offer, order, payment, product, review, system.

### Step 2: Email template structure
Templates are HTML string builders (not React Email). Each returns an HTML string.

```typescript
// apps/web/lib/email/templates/feature-templates.ts

import { emailLayout } from "../layout-dark";

export function featureActionEmail(data: {
  userName: string;
  actionTitle: string;
  actionUrl: string;
  details: string;
  locale?: string;
}): { subject: string; html: string } {
  const subject = `FreelanceHigh — ${data.actionTitle}`;

  const content = `
    <h2 style="color: #ffffff; font-size: 22px; margin: 0 0 16px;">
      Bonjour ${data.userName},
    </h2>
    <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
      ${data.details}
    </p>
    <a href="${data.actionUrl}"
      style="display: inline-block; background: #6C2BD9; color: #ffffff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px;">
      ${data.actionTitle}
    </a>
  `;

  return {
    subject,
    html: emailLayout({ content, preheader: data.details.substring(0, 100) }),
  };
}
```

### Step 3: Email layout (dark theme)
The `emailLayout()` function wraps content in FreelanceHigh branded layout:
- Dark background (#0f172a)
- Logo header
- Content area with padding
- Footer with legal links

Read `apps/web/lib/email/layout-dark.ts` for the exact template.

### Step 4: Sending emails
```typescript
import { sendEmail } from "@/lib/email";

await sendEmail({
  to: userEmail,
  subject: template.subject,
  html: template.html,
});
```

The email service uses **Resend** in production. In dev mode, emails are logged to console.

### Step 5: Trigger emails from events
Use the event system to trigger emails:
```typescript
// In apps/web/lib/events/dispatcher.ts
import { emitEvent } from "@/lib/events/dispatcher";

emitEvent("order.completed", {
  userId, userName, userEmail, orderId, amount,
});
```

Event listeners in `apps/web/lib/events/listeners.ts` handle sending the appropriate email.

### Step 6: Style guide
- **Background**: #0f172a (dark navy)
- **Text primary**: #ffffff
- **Text secondary**: #94a3b8 (slate-400)
- **Primary CTA**: #6C2BD9 (violet)
- **Success**: #10B981
- **Warning**: #f59e0b
- **Error**: #ef4444
- **Font**: system-ui, -apple-system, sans-serif
- **Border radius**: 8px for buttons, 12px for cards
- **All text in French** (accents OK in emails)

### Step 7: 23 required email templates (from PRD)
1. Confirmation inscription + OTP
2. Email bienvenue (onboarding)
3. Confirmation commande (client + freelance)
4. Nouveau message reçu
5. Livraison effectuée
6. Révision demandée
7. Commande validée → fonds libérés
8. Litige ouvert
9. Verdict litige rendu
10. Retrait demandé
11. Retrait disponible
12. Rappel : délai 24h
13. Rappel : livraison en attente 3j
14. Nouvelle candidature reçue
15. Candidature acceptée
16. Offre personnalisée reçue
17. Facture mensuelle
18. Renouvellement abonnement
19. Alerte nouvel appareil
20. Code 2FA
21. Réinitialisation mot de passe
22. KYC approuvé / refusé
23. Service approuvé / refusé
24. Nouveau membre agence
