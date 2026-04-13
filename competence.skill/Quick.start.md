# ⚡ QUICK START — 5 MINUTES

> **Trop impatient pour lire?** Commencez ici! ⚡

---

## 🚀 SETUP EN 2 MINUTES

```bash
# Copier-coller ces lignes dans votre terminal:

mkdir -p .claude/skills/freelancehigh-pro
mkdir -p .claude/skills/responsivite-pro
mkdir -p .claude/tasks
mkdir -p .claude/outputs/docs

# Placer les 6 fichiers reçus:
# → CLAUDE.md dans .claude/
# → freelancehigh-pro.skill.md dans .claude/skills/freelancehigh-pro/SKILL.md
# → ANTIPATTERNS.md dans .claude/skills/freelancehigh-pro/
# → VALIDATION-MATRIX.md dans .claude/skills/freelancehigh-pro/
# → RESPONSIVITÉ-PRO.skill.md dans .claude/skills/responsivite-pro/SKILL.md
# → RESPONSIVE-COMPONENTS.md dans .claude/skills/responsivite-pro/
```

✅ **C'est bon!** Les skills sont prêtes.

---

## 💬 LE PROMPT MAGIQUE À COPIER-COLLER

**Ouvrez Claude et collez ceci:**

```
Charge SKILL freelancehigh-pro
Charge SKILL responsivite-pro

Mode: AUTO DUAL

Tâche: [VOTRE TÂCHE ICI - Remplacez cette ligne par ce que vous voulez]

Exemple: "Créer une page Dashboard Freelancer avec stats, services list, recent orders"
```

---

## ⏱️ C'EST TOUT!

Claude va:
- ✅ Charger les 2 skills automatiquement
- ✅ Exécuter tous les piliers
- ✅ Créer du code parfait
- ✅ Écrire les tests
- ✅ Valider 12 dimensions
- ✅ Scanner 42 patterns dangereux
- ✅ Générer documentation
- ✅ Livrer PRODUCTION-READY

---

## 📝 QUELQUES EXEMPLES À COPIER-COLLER:

### Exemple 1: Dashboard Freelancer
```
Charge SKILL freelancehigh-pro
Charge SKILL responsivite-pro

Mode: AUTO DUAL

Tâche: Page Dashboard Freelancer avec:
- 4 cards stats (Services, Revenus, Commandes, Ratings)
- Tableau services avec actions (edit/delete)
- Graphique revenues 30 derniers jours
- Responsive 375px → 2000px
```

### Exemple 2: Formulaire d'inscription
```
Charge SKILL freelancehigh-pro
Charge SKILL responsivite-pro

Mode: AUTO DUAL

Tâche: Formulaire d'inscription 4 steps:
- Step 1: Email + Password
- Step 2: Prénom, Nom
- Step 3: Photo profil
- Step 4: Vérification + création compte
Avec validation Zod et tests E2E
```

### Exemple 3: Messagerie temps réel
```
Charge SKILL freelancehigh-pro
Charge SKILL responsivite-pro

Mode: AUTO DUAL

Tâche: Composant Messagerie avec:
- Listes conversations
- Zone messages avec scroll
- Input message + envoi
- Timestamps
- Notifications
- Responsive mobile-first
```

---

## ✅ APRÈS LA RÉPONSE DE CLAUDE:

1. **Cherchez le code** → Copier dans votre projet
2. **Cherchez VMD score** → Doit être >= 11/12
3. **Cherchez APD scan** → Doit être CLEAN (0 critique)
4. **Copier les tests** → Fusionner dans tests/
5. **Lire lessons learned** → Notes importantes pour éviter erreurs futures

---

## 🎯 RÉSULTAT ATTENDU:

```
✅ Code TypeScript strict (pas de any)
✅ Composants React responsives (375px → 2000px)
✅ Tests unitaires + E2E (coverage >= 80%)
✅ Tailwind CSS (mobile-first)
✅ Migrations Prisma si DB change
✅ Validation Zod pour inputs
✅ Documentation automatique
✅ VMD score >= 11/12
✅ APD scan = CLEAN
✅ Prêt à merger! 🚀
```

---

## 🚨 IMPORTANT:

```
❌ Ne PAS interrompre Claude pendant qu'il travaille
   → Attendez la fin complète

✅ Après la réponse de Claude:
   → Vérifiez VMD score
   → Vérifiez APD scan
   → Copier le code
   → Merger!
```

---

## 📞 BESOIN D'AIDE?

Consultez les fichiers complets:
- **INSTRUCTION-UTILISATION-SKILLS.md** → Guide détaillé (10 min)
- **freelancehigh-pro.skill.md** → Tous les 7 piliers expliqués
- **responsivite-pro.skill.md** → Tous les 12 piliers expliqués

---

## 🎉 VOUS ÊTES PRÊT!

1. Copier le prompt magique ⬆️
2. Remplacer [VOTRE TÂCHE ICI]
3. Appuyer sur Enter
4. Profiter du code parfait ✨

**C'est aussi simple que ça!** 🚀