FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    openssh-server \
    nodejs \
    npm \
    curl \
    sudo \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /var/run/sshd /app

COPY bridge.js /app/bridge.js
RUN cd /app && npm init -y && npm install ws

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["/entrypoint.sh"]
