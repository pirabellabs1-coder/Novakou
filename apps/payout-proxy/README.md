# Novakou — Proxy à IP fixe pour les versements FeexPay

Remplace **Fixie** (~19 000 F CFA/mois) par un mini-VPS que nous administrons
nous-mêmes. Coût : **0 à 2 500 F CFA/mois** selon le fournisseur retenu.

## Pourquoi ce proxy existe

FeexPay filtre par IP les appels de VERSEMENT (payout). Vercel a des IP de
sortie DYNAMIQUES : impossible de les whitelister. Il nous faut donc un
intermédiaire à IP fixe qui reçoit nos requêtes, les relaie à FeexPay, et
sort avec une IP stable et whitelistée.

Techno : **Squid**. Aucun code métier à maintenir — c'est un proxy HTTP
standard, éprouvé depuis 25 ans, configurable en 30 lignes.

## Choix du fournisseur VPS

| Fournisseur | Coût mensuel | IP fixe | Effort d'inscription | Recommandation |
|---|---|---|---|---|
| **Oracle Cloud Free** | **0 F CFA** | ✅ garantie | Vérification manuelle possible (24-48 h) | **Premier choix** |
| **Hetzner CX22** | ~2 500 F CFA | ✅ garantie | Immédiate, CB requise | Repli si Oracle refuse |
| Contabo VPS S | ~3 000 F CFA | ✅ garantie | Immédiate, CB requise | Alternative |
| Fixie (actuel) | ~19 000 F CFA | ✅ | Déjà en place | **À arrêter** |

### Option 1 — Oracle Cloud Free (recommandé)

1. Créer un compte sur https://www.oracle.com/cloud/free/. Carte bancaire
   requise pour vérification (jamais débitée si on reste dans le free tier).
2. Choisir la région **Frankfurt (EU-Frankfurt-1)** ou **Amsterdam**.
3. Créer une **VM Ampere A1** (ARM) : 4 cores, 24 GB RAM, Ubuntu 22.04.
4. Réserver une **IP publique statique** dans le menu Networking →
   Reserved Public IPs, l'attacher à la VM.
5. Ouvrir le port 3128 dans la Security List de la VCN par défaut :
   Ingress rule, source `0.0.0.0/0`, TCP port 3128.

### Option 2 — Hetzner CX22 (si Oracle refuse)

1. Créer un compte sur https://www.hetzner.com/cloud (CB requise, débit
   immédiat mais résiliable à l'heure).
2. Créer un projet Novakou → Add server → Location **Falkenstein DE** →
   Image **Ubuntu 22.04** → Type **CX22** (2 cores, 4 GB, ~4 €/mois).
3. L'IPv4 est automatiquement attachée et fixe pour la durée du serveur.
4. Ouvrir le port 3128 dans les Firewalls (menu Firewalls) : inbound TCP
   3128 depuis `0.0.0.0/0`.

## Déploiement (identique pour les deux fournisseurs)

```bash
# 1. SSH sur le VPS
ssh ubuntu@IP_DU_VPS      # (Oracle : user 'ubuntu' ; Hetzner : 'root')

# 2. Installer Docker
sudo apt update && sudo apt install -y docker.io docker-compose-v2
sudo usermod -aG docker $USER && newgrp docker

# 3. Récupérer le repo
git clone https://github.com/pirabellabs1-coder/Novakou.git
cd Novakou/apps/payout-proxy

# 4. Créer le fichier d'authentification.
#    L'utilisateur choisi ici (`novakou`) et le mot de passe qu'on tape
#    sont ceux à mettre dans PAYOUT_PROXY_URL côté Vercel.
docker run --rm -it -v $(pwd):/data httpd:2.4-alpine \
  htpasswd -c /data/passwd novakou

# 5. Lancer le proxy
docker compose up -d

# 6. Vérifier qu'il tourne
docker compose ps
docker compose logs --tail 20

# 7. Tester depuis un autre poste (remplacer IP + password) :
curl -x http://novakou:MOTDEPASSE@IP_DU_VPS:3128 https://api.feexpay.me/
# Doit retourner du HTML ou du JSON depuis FeexPay, PAS "Access Denied".
```

## Configuration Vercel

Une fois le proxy en ligne :

1. **Donner l'IP publique du VPS à FeexPay** (support ou dashboard).
   Attendre leur confirmation de whitelisting avant de basculer.
2. Sur https://vercel.com/dashboard → projet Novakou → Settings →
   Environment Variables :
   - Modifier `PAYOUT_PROXY_URL` :
     ```
     http://novakou:MOTDEPASSE@IP_DU_VPS:3128
     ```
3. Redéployer la production (Deployments → dernier deploy → Redeploy).
4. Faire un versement de test (10 F) et vérifier qu'il aboutit.
5. Attendre 48 h de fonctionnement propre.
6. **Résilier Fixie** — passer par le dashboard Fixie et cliquer sur
   « Cancel plan ». Économies : 19 000 F CFA/mois.

## Vérifications de sécurité

Le proxy est configuré pour :
- N'accepter QUE des connexions authentifiées (Basic Auth).
- Ne laisser passer QUE vers `api.feexpay.me` (whitelist stricte).
- Refuser tout autre hôte, même avec les bons identifiants.
- Ne jamais annoncer qu'il est un proxy (`via off`, headers `X-Forwarded-For`
  supprimés) — pour ne pas donner de prise à une détection anti-proxy chez
  FeexPay.

Pour vérifier qu'un attaquant ne peut pas sortir ailleurs :

```bash
# Doit être REFUSÉ (403 Forbidden)
curl -x http://novakou:MOTDEPASSE@IP_DU_VPS:3128 https://google.com/
```

## Surveillance et coûts

- **Logs d'accès** :
  `docker compose exec proxy tail -f /var/log/squid/access.log`
- **Statut** : Sentry alerte déjà côté Vercel via `alerterProxyHorsService()`
  dans `apps/web/lib/payout/proxy-fetch.ts`.
- **Rotation logs** : gérée par Squid (`logfile_rotate 7`), pas de risque
  de saturation disque.

## Résilier Fixie proprement

1. Se connecter sur https://usefixie.com/dashboard.
2. Vérifier qu'aucune requête ne passe plus par Fixie (métriques dashboard).
3. Cliquer sur « Cancel plan » sous Billing.
4. Retirer la variable Vercel `FIXIE_URL` si elle existe encore par ailleurs.
