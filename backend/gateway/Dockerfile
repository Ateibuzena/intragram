FROM node:20-alpine AS builder

WORKDIR /usr/src/app

RUN apk add --no-cache curl

COPY package.json ./
COPY gateway/package.json ./gateway/package.json
COPY services/auth/package.json ./services/auth/package.json
COPY services/chat/package.json ./services/chat/package.json
COPY services/users/package.json ./services/users/package.json
COPY shared/package.json ./shared/package.json
RUN npm install

COPY gateway/ ./gateway/
COPY shared/ ./shared/
RUN npm run build -w gateway

FROM node:20-alpine AS production

WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY package.json ./
COPY gateway/package.json ./gateway/package.json
COPY services/auth/package.json ./services/auth/package.json
COPY services/chat/package.json ./services/chat/package.json
COPY services/users/package.json ./services/users/package.json
COPY shared/package.json ./shared/package.json
RUN npm install --omit=dev && npm cache clean --force

COPY --from=builder /usr/src/app/gateway/dist ./gateway/dist

EXPOSE 3000

CMD ["npm", "run", "start", "-w", "gateway"]