# ./frontend/Dockerfile.prod
# Etapa de build
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar deps
COPY package*.json ./
RUN npm install

# Copiar todo el código
COPY . .

# Build de producción (Vite/React)
RUN npm run build

# Etapa de producción con NGINX
FROM nginx:alpine

# Copiar build a la ruta que NGINX sirve por defecto
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuración custom si quieres redirecciones o proxy a /api
COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf

# Exponer solo internamente (NGINX externo hará proxy)
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]