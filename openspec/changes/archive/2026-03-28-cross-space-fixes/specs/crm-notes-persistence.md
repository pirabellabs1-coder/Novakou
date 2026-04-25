# Spec: CRM Client Notes Persistence

Agency CRM notes must be saved to the database, not just shown in UI with a fake timeout save.

## Current behavior
- handleNotesBlur() shows "Notes sauvegardées" toast after 400ms setTimeout
- No API call — notes lost on refresh

## Expected behavior
- POST /api/agence/clients/notes with { clientId, note }
- Stored in AgencyProfile.settings.clientNotes JSON object
- Loaded on page mount and displayed per client

## Files
- NEW: `apps/web/app/api/agence/clients/notes/route.ts`
- MODIFY: `apps/web/app/agence/clients/page.tsx`
