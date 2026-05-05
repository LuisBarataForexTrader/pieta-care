#!/bin/bash
# deploy.sh — deploy pieta.care no Hetzner VPS
# Uso: ./deploy.sh
# Corre no servidor: ssh root@178.104.5.182 e depois ./deploy.sh

set -e

REPO="git@github.com:LuisBarataForexTrader/pieta-care.git"
APP_DIR="/opt/pieta-care"
COMPOSE="docker compose"

echo "🚀 pieta.care — iniciando deploy..."

# 1. Clonar ou actualizar repositório
if [ -d "$APP_DIR/.git" ]; then
    echo "📦 A actualizar repositório..."
    cd $APP_DIR
    git pull origin main
else
    echo "📦 A clonar repositório..."
    git clone $REPO $APP_DIR
    cd $APP_DIR
fi

# 2. Verificar .env
if [ ! -f "$APP_DIR/backend/.env" ]; then
    echo "❌ ERRO: $APP_DIR/backend/.env não existe!"
    echo "   Cria o ficheiro com base em backend/.env.example"
    exit 1
fi

# 3. Build e restart
echo "🔨 A fazer build..."
$COMPOSE build --no-cache api

echo "⬆️  A iniciar serviços..."
$COMPOSE up -d

# 4. Aguardar base de dados
echo "⏳ A aguardar PostgreSQL..."
sleep 5

# 5. Aplicar migrações Alembic
echo "🗄️  A aplicar migrações..."
$COMPOSE exec api alembic upgrade head

echo "✅ Deploy concluído!"
echo "   API: https://api.pieta.care"
echo "   Health: https://api.pieta.care/health"
