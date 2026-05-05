#!/bin/bash
# server-setup.sh — configuração inicial do Hetzner VPS
# Corre UMA VEZ como root no servidor: ssh root@178.104.5.182
# Depois: bash server-setup.sh

set -e

echo "🖥️  pieta.care — setup inicial do servidor..."

# 1. Actualizar sistema
apt-get update && apt-get upgrade -y

# 2. Instalar Docker
apt-get install -y ca-certificates curl gnupg
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 3. Iniciar Docker
systemctl enable docker
systemctl start docker

# 4. Criar directório da app
mkdir -p /opt/pieta-care

# 5. Configurar firewall
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw --force enable

echo "✅ Servidor configurado!"
echo ""
echo "Próximos passos:"
echo "1. Criar DNS: api.pieta.care → 178.104.5.182"
echo "2. Criar /opt/pieta-care/backend/.env (ver .env.example)"
echo "3. Correr: cd /opt/pieta-care && bash deploy.sh"
echo "4. SSL: bash ssl-setup.sh"
