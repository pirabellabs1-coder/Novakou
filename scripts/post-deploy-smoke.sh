#!/bin/bash
# Smoke test the freshly deployed prod endpoints.
# Each line is "label = HTTP_STATUS expected_pattern"
# Run after Vercel deploy reports success.

set -e
HOST="${1:-https://novakou.com}"

echo "Smoke testing $HOST"
echo "==============================="

check() {
  local label="$1"
  local url="$2"
  local expect="$3"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
  if [[ "$code" =~ ^($expect)$ ]]; then
    echo "  ✓ $label = $code"
  else
    echo "  ✗ $label = $code (expected $expect)"
    return 1
  fi
}

# Public marketing pages
check "Landing"            "$HOST/"                              "200"
check "Tarifs"             "$HOST/tarifs"                        "200"
check "Affiliation public" "$HOST/affiliation"                   "200"

# Auth-protected dashboard pages (redirect to /connexion → 307)
check "Mentor params"      "$HOST/mentor/parametres"             "307|200"
check "Affilie params"     "$HOST/affilie/parametres"            "307|200"
check "Apprenant params"   "$HOST/apprenant/parametres"          "307|200"
check "Vendeur params"     "$HOST/vendeur/parametres"            "307|200"

# API endpoints (auth required → 401, or method not allowed)
check "API profile"        "$HOST/api/profile"                   "401|307"
check "API affilie catalog" "$HOST/api/formations/affilie/catalog" "200|401"

# Cron endpoints (CRON_SECRET required → 401 if no auth header)
check "Cron affiliate-payout" "$HOST/api/cron/affiliate-payout"  "200|401"
check "Cron auto-payout"   "$HOST/api/cron/auto-payout"          "200|401"
check "Cron subscription-renewal" "$HOST/api/cron/subscription-renewal" "200|401"

# v1 public API (API key required)
check "API v1 products"    "$HOST/api/v1/products"               "401"
check "API v1 orders"      "$HOST/api/v1/orders"                 "401"

echo "==============================="
echo "Smoke test complete."
