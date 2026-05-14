#!/usr/bin/env bash
# ==============================================================================
# Noustelos Pool Services - Production Ubuntu VPS Deployment Script
# ==============================================================================
# Designed for automated deployment on clean Ubuntu 22.04 / 24.04 LTS servers.
# Sets up Node.js, PM2 Daemon, Firewall rules, and optionally configures Nginx.
# ==============================================================================

set -e

# Ensure script is run with sudo privileges
if [[ $EUID -ne 0 ]]; then
   echo "❌ This script must be run as root or with sudo privileges." 1>&2
   exit 1
fi

echo "=================================================================="
echo "🚀 Starting Noustelos Pool Services Automated VPS Deployment..."
echo "=================================================================="

# 1. Update system packages
echo "📦 Updating system package lists..."
apt-get update -y
apt-get upgrade -y
apt-get install -y curl git ufw nginx

# 2. Setup Node.js (v20 LTS recommended for best balance of stability & features)
if ! command -v node &> /dev/null; then
    echo "🟢 Installing Node.js LTS setup..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
else
    echo "✅ Node.js is already installed: $(node -v)"
fi

# 3. Install PM2 globally for production process management
if ! command -v pm2 &> /dev/null; then
    echo "⚙️ Installing PM2 Process Manager globally..."
    npm install -g pm2
else
    echo "✅ PM2 is already installed: $(pm2 -v)"
fi

# 4. Prepare project directory and dependencies
APP_DIR="/var/www/noustelos-pools"
echo "📂 Preparing Application Directory at $APP_DIR..."

# If running locally from repository folder, copy files over, or ensure directory exists
if [[ ! -d "$APP_DIR" ]]; then
    mkdir -p "$APP_DIR"
    # Assuming script is run from project root, copy contents
    cp -r ./* "$APP_DIR/"
else
    echo "⚠️ Target directory already exists. Syncing updated files..."
    cp -r ./* "$APP_DIR/"
fi

cd "$APP_DIR"

echo "📥 Installing production NPM dependencies..."
npm install --production

# 5. Handle Environment Variables securely
if [[ ! -f ".env" ]]; then
    echo "⚠️ No .env file found in production directory."
    if [[ -f ".env.example" ]]; then
        echo "📝 Copying template .env.example to .env..."
        cp .env.example .env
        echo "⚠️ CRITICAL: Please edit $APP_DIR/.env to input your live RESEND_API_KEY before routing emails."
    fi
else
    echo "✅ Active .env file confirmed."
fi

# 6. Configure UFW Firewall rules
echo "🛡️ Configuring basic UFW firewall access..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
# Only enable firewall if not active to prevent locking out non-standard SSH setups
# ufw --force enable

# 7. Start application daemon using PM2
echo "🔄 Starting Node.js backend cluster daemon via PM2..."
# Stop existing daemon if present to prevent overlap
pm2 stop noustelos-server 2>/dev/null || true
pm2 delete noustelos-server 2>/dev/null || true

# Start server script named 'noustelos-server'
pm2 start server.js --name "noustelos-server" --env production

# Setup PM2 to persist on server reboot
echo "💾 Saving PM2 process list for automatic server startup..."
pm2 save
pm2 startup systemd -u root --hp /root || true

# 8. Configure Nginx Reverse Proxy template
NGINX_CONF="/etc/nginx/sites-available/noustelos.gr"
echo "🌐 Configuring Nginx Reverse Proxy block..."

cat > "$NGINX_CONF" << 'EOF'
server {
    listen 80;
    server_name noustelos.gr www.noustelos.gr;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Enable configuration if not already present
ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/
# Remove default site to avoid server conflicts
rm -f /etc/nginx/sites-enabled/default

echo "🧪 Testing Nginx configuration syntax..."
nginx -t && systemctl reload nginx

echo "=================================================================="
echo "🎉 DEPLOYMENT COMPLETE!"
echo "👉 Your application is running actively on port 3000 behind Nginx."
echo "👉 Verify real-time logs using: pm2 logs noustelos-server"
echo "=================================================================="
