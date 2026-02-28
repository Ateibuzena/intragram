# 🔌 Arquitectura de Microservicios - Intragram

## Protocolo Seleccionado: TCP

### ✅ Decisión: TCP (NestJS Microservices)

**Ventajas:**
- ✅ Comunicación bidireccional rápida y eficiente
- ✅ Sin overhead de HTTP (headers, parsing)
- ✅ Serialización JSON nativa con TypeScript
- ✅ Patrón request-response y eventos
- ✅ No requiere dependencias externas adicionales
- ✅ Fácil debugging y desarrollo

**Configuración:**
```typescript
Transport.TCP
Host: nombre-del-servicio (en Docker)
Puerto: específico por microservicio
```

---

## 🏗️ Arquitectura Implementada

```
┌──────────────────────────────────────────────────┐
│                   NGINX (Puerto 80)              │
│            Reverse Proxy & Load Balancer         │
└──────────────────┬───────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────┐
│          API GATEWAY (Puerto 3000)               │
│                 NestJS HTTP                      │
│  ┌────────────────────────────────────────────┐  │
│  │  Controllers: auth, chat, posts, etc.     │  │
│  │  Services: Proxies a microservicios       │  │
│  │  Observability: Metrics + Logging         │  │
│  └────────────────────────────────────────────┘  │
└──────────────────┬───────────────────────────────┘
                   │
       ┌───────────┼───────────┐
       │           │           │
       ▼           ▼           ▼
   ┌───────┐  ┌───────┐  ┌───────┐
   │ Auth  │  │ Chat  │  │ Posts │
   │ :3003 │  │ :3004 │  │ :3005 │
   └───┬───┘  └───┬───┘  └───┬───┘
       │          │          │
       ▼          ▼          ▼
    [DB]       [DB]       [DB]
```

---

## 📡 Comunicación entre Servicios

### Gateway → Microservicios (TCP)

**Gateway** envía peticiones usando `ClientProxy`:
```typescript
this.authService.send('login', loginDto)
this.chatService.emit('message.sent', messageData)
```

**Microservicios** escuchan patrones:
```typescript
@MessagePattern('login')
handleLogin(data: LoginDto) { ... }

@EventPattern('message.sent')
handleMessageSent(data: any) { ... }
```

---

## 🔧 Configuración de Servicios

### Gateway (Puerto 3000)
- **Tipo:** HTTP Server (Express/NestJS)
- **Función:** API REST pública
- **Conecta a:** Auth (TCP), Chat (TCP), Posts (TCP)

### Auth Service (Puerto 3003)
- **Tipo:** TCP Microservice
- **Función:** Autenticación y usuarios
- **Escucha:** `0.0.0.0:3003`
- **Patrones:** `register`, `login`, `validate-token`

### Chat Service (Puerto 3004)
- **Tipo:** TCP Microservice
- **Función:** Mensajería y conversaciones
- **Escucha:** `0.0.0.0:3004`
- **Patrones:** `send-message`, `get-conversations`, `get-messages`

---

## 🌐 Redes Docker

### frontend-net
- Frontend (React/Vite)

### backend-net
- NGINX → Gateway

### service-net
- Gateway ↔ Microservicios
- Microservicios ↔ Prometheus/Grafana

---

## 📦 Dependencias Instaladas

### Gateway
```json
{
  "@nestjs/microservices": "^11.1.14",
  "@nestjs/axios": "^4.0.1",
  "class-validator": "^0.15.1",
  "class-transformer": "^0.5.1"
}
```

### Microservicios (Auth, Chat)
```json
{
  "@nestjs/microservices": "^11.1.14",
  "@nestjs/common": "^11.0.1",
  "@nestjs/core": "^11.0.1"
}
```

---

## 🚀 Próximos Pasos

1. ✅ Protocolo TCP configurado
2. ✅ Dependencias instaladas
3. ⏭️ Implementar controladores y servicios del Gateway
4. ⏭️ Implementar lógica de microservicios
5. ⏭️ Configurar DTOs con validaciones
6. ⏭️ Registrar módulos en AppModule
7. ⏭️ Testing y deployment

---

## 📚 Recursos

- [NestJS Microservices TCP](https://docs.nestjs.com/microservices/basics)
- [Message Patterns](https://docs.nestjs.com/microservices/basics#patterns)
- [Event Patterns](https://docs.nestjs.com/microservices/basics#event-based)
