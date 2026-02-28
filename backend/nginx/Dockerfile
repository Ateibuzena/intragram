FROM nginx:1.25-alpine

# Install OpenSSL for SSL certificates
RUN apk add --no-cache openssl

# Create SSL directory and generate self-signed certificate
RUN mkdir -p /etc/nginx/ssl && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/nginx.key \
    -out /etc/nginx/ssl/nginx.crt \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Copy nginx configuration
COPY config/nginx.conf /etc/nginx/nginx.conf

# Expose HTTPS port
EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]
