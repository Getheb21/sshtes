FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    openssh-server \
    stunnel4 \
    openssl \
    curl \
    wget \
    nodejs \
    npm \
    sudo \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# Install websocat (WebSocket client/server)
RUN curl -L https://github.com/vi/websocat/releases/latest/download/websocat.x86_64-unknown-linux-musl -o /usr/local/bin/websocat && \
    chmod +x /usr/local/bin/websocat

RUN mkdir -p /var/run/sshd /var/run/stunnel /app

# Sertifikat SSL
RUN openssl req -new -newkey rsa:2048 -days 365 -nodes -x509 \
    -subj "/C=ID/ST=Jakarta/L=Jakarta/O=RailwayProxy/CN=localhost" \
    -keyout /etc/stunnel/stunnel.pem -out /etc/stunnel/stunnel.pem

# Node.js WebSocket bridge
COPY bridge.js /app/bridge.js
RUN cd /app && npm init -y && npm install ws http net tls

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8080 48495

ENTRYPOINT ["/entrypoint.sh"]
