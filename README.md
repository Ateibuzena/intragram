# intragram
Red social para 42 Málaga


📁 Estructura del Backend Documentada:
Gateway (src)
main.ts - Punto de entrada del API Gateway
app.module.ts - Módulo raíz que importa todos los módulos
app.controller.ts - Controlador principal con rutas base
app.service.ts - Servicio principal con lógica global
app.controller.spec.ts - Tests unitarios del controlador
Observabilidad (observability)
logger.module.ts / logger.service.ts - Sistema de logging centralizado
metrics.module.ts / metrics.service.ts - Recolección de métricas (Prometheus)
metrics.interceptor.ts - Interceptor para capturar métricas HTTP
Servicios del Gateway
Auth (auth)
auth.controller.ts - Endpoints de registro, login, logout
auth.module.ts - Configuración del cliente gRPC/TCP
auth.service.ts - Proxy hacia el microservicio de autenticación
DTOs: login.dto, register.dto, auth-response.dto
Interface: auth-service.interface.ts
Chat (chat)
chat.controller.ts - Endpoints de mensajería
chat.module.ts - Configuración del cliente gRPC/TCP
chat.service.ts - Proxy hacia el microservicio de chat

DTOs: send-message.dto
Interface: chat-service.interface.ts
Example (example)
Plantillas de referencia para crear nuevos módulos
Microservicios (services)
main.ts - Microservicio de autenticación
auth-db.sh - Script de inicialización de BD (usuarios, sesiones, tokens)
main.ts - Microservicio de chat y mensajería
chat-db.sh - Script de inicialización de BD (conversaciones, mensajes)
main.ts - Plantilla para nuevos microservicios
example-db.sh - Plantilla de script de BD
Todos los archivos ahora tienen comentarios descriptivos en español que explican su propósito y funcionalidad dentro de la arquitectura de microservicios.