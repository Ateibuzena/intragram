version: '3.8'

services:
  # ===========================================
  # FRONTEND
  # ===========================================
  frontend:
    container_name: frontend
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    networks:
      - frontend-net
    restart: unless-stopped

  # ===========================================
  # HERRAMIENTAS DE MONITOREO (OPCIONAL)
  # ===========================================
  prometheus:
    container_name: prometheus
    build:
        context: ./backend/observability/prometheus
        dockerfile: Dockerfile
    ports:
        - "9090:9090"
    networks:
        - service-net
    restart: unless-stopped

  grafana:
    container_name: grafana
    build:
        context: ./backend/observability/grafana
        dockerfile: Dockerfile
    ports:
        - "3001:3000"
    depends_on:
        - prometheus
    networks:
        - service-net
    restart: unless-stopped

  # ===========================================
  # MICROSERVICIOS
  # ===========================================

  example-service:
    container_name: example-service
    build:
      context: ./backend/services/example
      dockerfile: Dockerfile.dev
    environment:
      SERVICE_URL: http://example-service:3005
    volumes:
      - ./backend/services/example/src:/app/src
      - /app/node_modules
    ports:
      - "3005:3005"
    networks:
      - service-net
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3005/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    restart: unless-stopped

  # Microservicio de Autenticación
  auth-service:
    container_name: auth-service
    build:
      context: ./backend/services/auth
      dockerfile: Dockerfile.dev
    environment:
      SERVICE_URL: http://auth-service:3003
    volumes:
      - ./backend/services/auth/src:/app/src
      - ./backend/services/auth/src/db:/app/db
      - /app/node_modules
    ports:
      - "3003:3003"
    networks:
      - service-net
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3003/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    restart: unless-stopped

  # Microservicio de Chat
  chat-service:
    container_name: chat-service
    build:
      context: ./backend/services/chat
      dockerfile: Dockerfile.dev
    environment:
      SERVICE_URL: http://chat-service:3004
    volumes:
      - ./backend/services/chat/src:/app/src
      - ./backend/services/chat/src/db:/app/db
      - /app/node_modules
    ports:
      - "3004:3004"
    networks:
      - service-net
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3004/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    restart: unless-stopped

  # ===========================================
  # API GATEWAY
  # ===========================================

  gateway:
    container_name: gateway
    build:
      context: ./backend/gateway
      dockerfile: Dockerfile.dev
    environment:
      NODE_ENV: development
      PORT: 3000
    
      JWT_SECRET: ${JWT_SECRET:-your-super-secret-jwt-key-change-in-production}
      # CORS
      CORS_ORIGIN: ${CORS_ORIGIN:-http://localhost:5173}
      # Rate limiting
      RATE_LIMIT_TTL: ${RATE_LIMIT_TTL:-60}
      RATE_LIMIT_MAX: ${RATE_LIMIT_MAX:-100}      

      SERVICE_URL: gateway:3000
      GRAFANA_URL: http://grafana:3001
      EXAMPLE_URL: http://example-service:3005
      #AUTH_SERVICE_URL: http://auth-service:3003
      #CHAT_SERVICE_URL: http://chat-service:3004

    volumes:
      - ./backend/gateway/src:/app/src
      - /app/node_modules
    ports:
      - "3000:3000"
    networks:
      - backend-net
      - service-net
    depends_on:
      - example-service
      #- auth-service
      #- chat-service
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    restart: unless-stopped

  # ===========================================
  # NGINX - REVERSE PROXY
  # ===========================================

  nginx:
    container_name: nginx
    build:
      context: ./backend/nginx
      dockerfile: Dockerfile
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./backend/nginx/config/nginx.conf:/etc/nginx/nginx.conf:ro
      - nginx-logs:/var/log/nginx
    networks:
      - backend-net
    depends_on:
      - gateway
    healthcheck:
      test: ["CMD", "nginx", "-t"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

# ===========================================
# REDES
# ===========================================

networks:
  frontend-net:
    driver: bridge
    name: frontend-net
  backend-net:
    driver: bridge
    name: backend-net
  service-net:
    driver: bridge
    name: service-net

# ===========================================
# VOLÚMENES PERSISTENTES
# ===========================================

volumes:
  profile-data:
    name: profile-data
  nginx-logs:
    name: nginx-logs
