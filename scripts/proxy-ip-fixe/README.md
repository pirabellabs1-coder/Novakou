# Proxy à IP fixe pour les versements — remplacer Fixie par notre serveur

FeexPay n'accepte les versements que depuis des IP fixes whitelistées. Vercel sort
par des IP dynamiques. Ce dossier permet de tenir ce rôle **nous-mêmes**, sur un
petit serveur, au lieu de louer un service au nombre de requêtes.

Le code de Novakou ne change pas : il lit `PAYOUT_PROXY_URL` et ne s'en sert que
pour FeexPay (voir `apps/web/lib/payout/proxy-fetch.ts`).

## Mise en place — 10 minutes

1. **Obtenir une machine à IP fixe — gratuitement, sans abonnement.**
   Le logiciel est à nous ; seule l'IP fixe doit venir d'une machine quelque part.
   Deux offres « gratuites pour toujours » (pas d'essai limité dans le temps) :

   - **Oracle Cloud « Always Free »** — recommandé. Une VM Ubuntu avec IP publique
     fixe, sans frais, sans limite de durée. Une carte est demandée à l'inscription
     pour vérifier l'identité, **jamais débitée** sur les ressources Always Free.
     Créer une instance *VM.Standard.E2.1.Micro* (ou ARM *A1.Flex*), Ubuntu 22.04,
     région **Paris ou Francfort**, avec « Assign a public IPv4 address » coché.
     Dans le pare-feu Oracle (*Security List* du VCN), ouvrir le port **8899/TCP**
     en entrée — le pare-feu de la VM sera réglé par le script.
   - **Google Cloud « Always Free »** — une VM *e2-micro* gratuite (régions US
     seulement), IP statique gratuite tant qu'elle est attachée à la VM.

   Une VM à ~4 €/mois (Hetzner, OVH…) marche aussi, mais n'est pas nécessaire.

2. **Se connecter en SSH** en root et lancer :
   ```bash
   bash <(curl -fsSL https://raw.githubusercontent.com/pirabellabs1-coder/Novakou/main/scripts/proxy-ip-fixe/installer.sh)
   ```
   Le script installe le proxy, ferme tout sauf SSH et le port du proxy, génère un
   mot de passe long, et affiche **deux lignes** à la fin.

3. **Whitelister l'IP** affichée dans FeexPay → *Adresses IP autorisées* (là où
   figurent aujourd'hui les deux IP Fixie).

4. **Poser `PAYOUT_PROXY_URL`** sur Vercel (Production + Preview) avec la valeur
   affichée, en remplacement de l'ancienne. La marquer *sensitive*.

5. **Redéployer** (Vercel → dernier déploiement → Redeploy).

6. **Vérifier** depuis l'admin : `/api/formations/admin/payout-proxy-check` doit
   répondre `proxyWorks: true` avec l'IP du serveur.

7. **Résilier Fixie** et **supprimer ses deux IP** de la liste FeexPay.

## Coût de fonctionnement

Zéro. Le proxy ne relaie que les appels FeexPay de versement — quelques requêtes
par retrait. Même une machine minuscule ne s'en apercevra pas.

## Piste pour ne plus avoir de proxy du tout

Écrire au support FeexPay pour demander à **désactiver le filtre IP** sur le
compte (l'authentification par clé suffit chez la plupart des passerelles — FedaPay,
PawaPay, Monetbil et iPay ne filtrent pas). S'ils acceptent, `PAYOUT_PROXY_URL`
se vide et tout ce dossier devient inutile. Ça ne coûte qu'un e-mail.

## Sécurité — ce qu'il faut savoir

- La seule barrière est le **mot de passe** (l'IP de Vercel ne peut pas être
  restreinte). Il fait 40 caractères aléatoires ; ne le partage pas et ne le
  commite jamais.
- Le proxy n'autorise que les tunnels HTTPS vers le port 443 : il ne peut pas
  servir à naviguer ni à atteindre autre chose que des API en TLS.
- Le trafic passerelle reste chiffré de bout en bout (TLS) : le proxy ne voit ni
  clés ni montants, il ne fait que relayer le tunnel.
- Mises à jour : `apt-get update && apt-get upgrade -y` de temps en temps, ou
  activer `unattended-upgrades`.

## Si un jour l'IP change (serveur recréé)

Refaire les étapes 3 → 5. Rien d'autre.
