#!/bin/bash
# ssl-setup.sh — emitir certificado SSL via Let's Encrypt
# Corre DEPOIS do deploy.sh e depois de o DNS estar configurado
# Uso: bash ssl-setup.sh

set -e

DOMAIN="api.pieta.care"
EMAIL="luis@flow88.pt"  # alterar para o teu email

echo "🔒 A emitir certificado SSL para $DOMAIN..."

# 1. Nginx a servir HTTP temporariamente para validação
docker compose exec nginx nginx -s reload 2>/dev/null || true

# 2. Emitir certificado
docker compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN

# 3. Reload Nginx com SSL activo
docker compose exec nginx nginx -s reload

echo "✅ SSL configurado para $DOMAIN"
echo "   Renovação automática: o certbot renova a cada 12h"
