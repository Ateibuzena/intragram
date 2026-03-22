FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./
COPY gateway/package.json ./gateway/package.json
COPY services/auth/package.json ./services/auth/package.json
COPY services/chat/package.json ./services/chat/package.json
COPY services/users/package.json ./services/users/package.json
COPY shared/package.json ./shared/package.json
RUN npm install

COPY services/auth/ ./services/auth/
COPY shared/ ./shared/
RUN npm run build -w services/auth

FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache curl

COPY package.json ./
COPY gateway/package.json ./gateway/package.json
COPY services/auth/package.json ./services/auth/package.json
COPY services/chat/package.json ./services/chat/package.json
COPY services/users/package.json ./services/users/package.json
COPY shared/package.json ./shared/package.json
RUN npm install --omit=dev && npm cache clean --force

COPY --from=builder /app/services/auth/dist ./services/auth/dist

EXPOSE 3003

USER node

CMD ["npm", "run", "start", "-w", "services/auth"]
