# Proxy à IP fixe pour les versements — remplacer Fixie par notre serveur

FeexPay n'accepte les versements que depuis des IP fixes whitelistées. Vercel sort
par des IP dynamiques. Ce dossier permet de tenir ce rôle **nous-mêmes**, sur un
petit serveur, au lieu de louer un service au nombre de requêtes.

Le code de Novakou ne change pas : il lit `PAYOUT_PROXY_URL` et ne s'en sert que
pour FeexPay (voir `apps/web/lib/payout/proxy-fetch.ts`).

## Mise en place — 10 minutes

1. **Louer un serveur** Linux minimal, Ubuntu 22.04/24.04 ou Debian 12.
   N'importe quel hébergeur avec IP fixe incluse convient — Hetzner (CX22, ~4 €),
   OVH, Scaleway, DigitalOcean… Choisir une région **Europe de l'Ouest** (proche
   de FeexPay). Aucune autre option à cocher.

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
