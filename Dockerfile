FROM ubuntu:22.04

RUN apt-get update && apt-get install -y openssh-server microsocks curl netcat

# Setup SSH
RUN mkdir /var/run/sshd && \
    echo 'root:root123' | chpasswd && \
    sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config && \
    sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config

# Expose port
EXPOSE 22 1080 8080

# Start SSH + SOCKS5 proxy
CMD service ssh start && microsocks -p 1080 -u root -P root123 && tail -f /dev/null
