FROM ubuntu:22.04

RUN apt-get update && apt-get install -y openssh-server curl wget netcat-openbsd

# Setup SSH
RUN mkdir -p /var/run/sshd && \
    echo 'root:root123' | chpasswd && \
    echo 'PermitRootLogin yes' >> /etc/ssh/sshd_config && \
    echo 'PasswordAuthentication yes' >> /etc/ssh/sshd_config && \
    echo 'Port 22' >> /etc/ssh/sshd_config && \
    echo 'ListenAddress 0.0.0.0' >> /etc/ssh/sshd_config

# Buka port
EXPOSE 22 80 443

# Start SSH server
CMD service ssh start && tail -f /dev/null
