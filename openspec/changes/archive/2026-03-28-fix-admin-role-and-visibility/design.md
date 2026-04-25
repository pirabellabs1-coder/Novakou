# Design: Fix Admin Role + Visibility

## 1. Role Check Fix

Au lieu de modifier chaque route individuellement, normaliser dans le JWT callback pour que `session.user.role` soit toujours lowercase.

**Fichier**: `lib/auth/config.ts`
```
token.role = ((user.role as string) ?? "client").toLowerCase();
```

Cela corrige TOUTES les routes en une seule modification, car elles vérifient toutes `role !== "admin"`.

Aussi ajouter un fallback de sécurité dans chaque route admin critique pour supporter les deux casses (ceinture et bretelles).

## 2. Dispute Visibility

**Fichier**: `api/admin/disputes/route.ts` GET
- Ajouter `reason` et `clientArgument` dans le mapping de la réponse Prisma

## 3. KYC Metadata

**Fichier**: `api/admin/kyc/route.ts` GET
- Ajouter `metadata` dans la réponse Prisma pour que l'admin voie les URLs de documents

**Fichier**: `store/admin.ts`
- Étendre `AdminKycRequest` avec `documentType`, `documentSubmitted`, `metadata`

## 4. Admin Services Role Check

**Fichier**: `api/admin/services/route.ts`
- Aussi `api/admin/services/[id]/route.ts`
- Normaliser check: `role !== "admin"` → case-insensitive

## Contraintes
- NE PAS changer le schéma Prisma
- Garder la compatibilité dev store
- Les modifications doivent être rétro-compatibles
