FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./
COPY gateway/package.json ./gateway/package.json
COPY services/auth/package.json ./services/auth/package.json
COPY services/chat/package.json ./services/chat/package.json
COPY services/posts/package.json ./services/posts/package.json
COPY services/users/package.json ./services/users/package.json
COPY shared/package.json ./shared/package.json
RUN npm install

COPY services/posts/ ./services/posts/
COPY shared/ ./shared/
RUN npm run build -w shared
RUN npm run build -w services/posts

FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache curl

COPY package.json ./
COPY gateway/package.json ./gateway/package.json
COPY services/auth/package.json ./services/auth/package.json
COPY services/chat/package.json ./services/chat/package.json
COPY services/posts/package.json ./services/posts/package.json
COPY services/users/package.json ./services/users/package.json
COPY shared/package.json ./shared/package.json
RUN npm install --omit=dev && npm cache clean --force

COPY --from=builder /app/shared ./shared
COPY --from=builder /app/services/posts/dist ./services/posts/dist

EXPOSE 3007

USER node

CMD ["npm", "run", "start", "-w", "services/posts"]
