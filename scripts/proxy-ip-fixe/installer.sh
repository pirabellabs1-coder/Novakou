#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════════════
#  PROXY À IP FIXE POUR LES VERSEMENTS NOVAKOU — installation en une commande
# ══════════════════════════════════════════════════════════════════════════
#
#  Pourquoi ce fichier existe
#  --------------------------
#  FeexPay n'accepte les versements que depuis des IP fixes whitelistées, et
#  Vercel sort par des IP dynamiques. On louait ce service à Fixie, au nombre
#  de requêtes : le forfait s'est retrouvé consommé deux fois (5 000 / 2 500),
#  et pendant douze jours aucun versement FeexPay n'est parti.
#
#  Ce script transforme n'importe quel petit serveur Linux (Hetzner, OVH,
#  Scaleway, DigitalOcean… ~4 €/mois) en proxy HTTP authentifié, dont l'IP
#  ne change jamais. Aucun plafond de requêtes. Rien à changer dans le code :
#  PAYOUT_PROXY_URL sur Vercel pointe simplement sur cette machine.
#
#  Usage (sur un Ubuntu/Debian FRAÎCHEMENT créé, en root) :
#      curl -fsSL <url-de-ce-fichier> | bash
#    ou
#      bash installer.sh
#
#  À la fin, il affiche la ligne exacte à coller dans Vercel.
# ══════════════════════════════════════════════════════════════════════════
set -euo pipefail

if [[ "$(id -u)" -ne 0 ]]; then
  echo "À lancer en root (sudo bash installer.sh)." >&2
  exit 1
fi

PORT="${PROXY_PORT:-8899}"
USER_PROXY="${PROXY_USER:-novakou}"
# Mot de passe long et aléatoire : c'est la SEULE protection du proxy, puisque
# l'IP source (Vercel) ne peut pas être restreinte. 40 caractères, sans
# caractère spécial pour rester copiable dans une URL sans encodage.
PASS_PROXY="${PROXY_PASS:-$(tr -dc 'A-Za-z0-9' </dev/urandom | head -c 40)}"

echo "→ Installation de tinyproxy…"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq tinyproxy ufw curl >/dev/null

echo "→ Configuration…"
cat >/etc/tinyproxy/tinyproxy.conf <<EOF
User tinyproxy
Group tinyproxy
Port ${PORT}
Timeout 60
LogLevel Warning
PidFile "/run/tinyproxy/tinyproxy.pid"
MaxClients 50

# Authentification obligatoire : sans ces identifiants, refus.
BasicAuth ${USER_PROXY} ${PASS_PROXY}

# Ne PAS révéler qu'on est un proxy ni l'IP d'origine.
DisableViaHeader Yes
XTinyproxy No

# Seul le tunnel HTTPS (CONNECT) vers le port 443 est autorisé : le proxy ne
# sert qu'à atteindre les API des passerelles, rien d'autre.
ConnectPort 443

# Refuser tout le monde par défaut n'est PAS possible ici (l'IP de Vercel
# change) : c'est l'authentification qui fait barrage.
Allow 0.0.0.0/0
Allow ::/0
EOF

mkdir -p /run/tinyproxy && chown tinyproxy:tinyproxy /run/tinyproxy

echo "→ Pare-feu : SSH + port du proxy uniquement…"
ufw --force reset >/dev/null
ufw default deny incoming >/dev/null
ufw default allow outgoing >/dev/null
ufw allow OpenSSH >/dev/null
ufw allow "${PORT}/tcp" >/dev/null
ufw --force enable >/dev/null

systemctl enable tinyproxy >/dev/null 2>&1 || true
systemctl restart tinyproxy

echo "→ Vérification…"
sleep 1
IP_PUBLIQUE="$(curl -fsS https://api.ipify.org || true)"
IP_VIA_PROXY="$(curl -fsS -x "http://${USER_PROXY}:${PASS_PROXY}@127.0.0.1:${PORT}" https://api.ipify.org || true)"

echo
echo "══════════════════════════════════════════════════════════════════════"
if [[ -n "$IP_VIA_PROXY" && "$IP_VIA_PROXY" == "$IP_PUBLIQUE" ]]; then
  echo "  ✔ Proxy opérationnel."
else
  echo "  ✘ Le proxy ne répond pas comme attendu (ip=${IP_PUBLIQUE:-?} via=${IP_VIA_PROXY:-?})."
  echo "    journalctl -u tinyproxy -n 50   pour voir pourquoi."
fi
echo
echo "  IP FIXE À WHITELISTER CHEZ FEEXPAY :  ${IP_PUBLIQUE}"
echo
echo "  VARIABLE À POSER SUR VERCEL (Production + Preview), puis REDÉPLOYER :"
echo "  PAYOUT_PROXY_URL=http://${USER_PROXY}:${PASS_PROXY}@${IP_PUBLIQUE}:${PORT}"
echo
echo "  Garde cette ligne en lieu sûr : le mot de passe n'est stocké que dans"
echo "  /etc/tinyproxy/tinyproxy.conf sur cette machine."
echo "══════════════════════════════════════════════════════════════════════"
