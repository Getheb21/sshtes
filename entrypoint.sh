#!/bin/bash

USER_NAME="${SSH_USER:-root}"
USER_PASS="${SSH_PASSWORD:-root123}"
WS_PORT="${PORT:-8080}"
TLS_PORT="${TLS_PORT:-48495}"

echo "[*] Configuring SSH User..."
if ! id "$USER_NAME" &>/dev/null; then
    useradd -m -s /bin/bash "$USER_NAME"
    usermod -aG sudo "$USER_NAME"
fi
echo "$USER_NAME:$USER_PASS" | chpasswd

echo "[*] Starting OpenSSH..."
/usr/sbin/sshd

echo "[*] Starting Hybrid Bridge..."
cd /app && node bridge.js &

echo "[*] Starting Stunnel (SSL/TLS)..."
cat <<EOF > /etc/stunnel/stunnel.conf
pid = /var/run/stunnel.pid
foreground = yes

[ssh-ssl]
accept = 0.0.0.0:$TLS_PORT
connect = 127.0.0.1:22
cert = /etc/stunnel/stunnel.pem
EOF

echo "============================================"
echo "  SSH PROXY HUB READY"
echo "  SSH User: $USER_NAME"
echo "  SSH Pass: $USER_PASS"
echo "  WS Port: $WS_PORT"
echo "  TLS Port: $TLS_PORT"
echo "============================================"

exec stunnel /etc/stunnel/stunnel.conf
