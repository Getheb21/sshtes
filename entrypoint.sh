#!/bin/bash

USER_NAME="${SSH_USER:-root}"
USER_PASS="${SSH_PASSWORD:-root123}"
PORT="${PORT:-8080}"

echo "[*] Setup user SSH..."
if ! id "$USER_NAME" &>/dev/null; then
    useradd -m -s /bin/bash "$USER_NAME"
    usermod -aG sudo "$USER_NAME"
fi
echo "$USER_NAME:$USER_PASS" | chpasswd

echo "[*] Start OpenSSH..."
/usr/sbin/sshd

echo "============================================"
echo "  SSH WS TUNNEL READY"
echo "  User: $USER_NAME"
echo "  Pass: $USER_PASS"
echo "  Port: $PORT"
echo "============================================"

cd /app && exec node bridge.js
