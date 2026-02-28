# 📖 Servicio Example - Plantilla de Referencia

## 🎯 Propósito

Este es un **servicio de ejemplo completo** que sirve como **plantilla** para entender cómo funciona la arquitectura de microservicios con TCP y **base de datos real**.

## 🗄️ Base de Datos

### SQLite (Producción: PostgreSQL/MySQL)
- **Archivo:** `db/example.db`
- **Driver:** `better-sqlite3`
- **Tablas:** `examples`
- **Auto-inicialización:** Se crea automáticamente al iniciar el servicio

### Script de Inicialización
```bash
# Crear/resetear base de datos manualmente
npm run db:init

# Resetear completamente
npm run db:reset
```

### Estructura de la tabla
```sql
CREATE TABLE examples (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🏗️ Estructura

### Gateway (HTTP → TCP)
```
backend/gateway/src/services/example/
├── example.module.ts        → Registra ClientsModule con TCP
├── example.controller.ts    → Endpoints REST (POST/GET)
├── example.service.ts       → Lógica de comunicación con microservicio
├── dto/
│   └── dto.ts              → Validación con class-validator
└── interfaces/
    └── example-service.interface.ts → Tipos y patrones
```

### Microservicio (TCP Listener + Database)
```
backend/services/example/src/
├── main.ts                  → Servidor TCP en puerto 3005
├── example.module.ts        → Módulo del microservicio
├── example.controller.ts    → @MessagePattern y @EventPattern
├── example.service.ts       → Lógica de negocio
├── database.service.ts      → Servicio de BD (SQLite)
└── db/
    └── example-db.sh       → Script de inicialización
```

## 🔄 Flujo de Comunicación

```
Cliente HTTP
    │
    ▼
POST /example { name: "Test" }
    │
    ▼
Gateway (ExampleController)
    │
    ▼
ExampleService.createExample(dto)
    │
    ▼
ClientProxy.send('create-example', dto) ← TCP
    │
    ▼
Microservicio Example (puerto 3005)
    │
    ▼
@MessagePattern('create-example')
    │
    ▼
ExampleService.create(data)
    │
    ▼
DatabaseService.create() → SQLite
    │
    ▼
Retorna { id, name, created_at }
    │
    ▼
Cliente recibe respuesta
```

## 🚀 Cómo Usarlo

### 1. Instalar dependencias
```bash
cd backend/services/example
npm install
```

### 2. (Opcional) Inicializar BD manualmente
```bash
npm run db:init
```

### 3. Iniciar el microservicio
```bash
npm run start:dev
# Verás:
# 📦 Conectado a SQLite: /path/to/db/example.db
# ✅ Datos de ejemplo insertados
# 🚀 Example Microservice is listening on TCP port 3005
```

### 4. Iniciar el gateway (en otra terminal)
```bash
cd backend/gateway
npm run start:dev
```

## 🧪 Endpoints Disponibles

### POST /example
Crear un nuevo ejemplo (se guarda en BD)
```bash
curl -X POST http://localhost:3000/example \
  -H "Content-Type: application/json" \
  -d '{"name":"Mi Ejemplo","description":"Test con BD real","category":"demo"}'
```

### GET /example
Obtener todos los ejemplos (desde BD)
```bash
curl http://localhost:3000/example
```

### GET /example/:id
Obtener un ejemplo por ID (desde BD)
```bash
curl http://localhost:3000/example/1
```

## 📦 Dependencias de Base de Datos

```json
{
  "dependencies": {
    "better-sqlite3": "^9.2.2"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.8"
  }
}
```

## 🎓 Conceptos Clave

### 1. **DatabaseService**
Servicio dedicado para manejar la conexión y operaciones de BD:
```typescript
@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private db: Database.Database;
  
  onModuleInit() {
    this.db = new Database(this.dbPath);
    this.initTables();
  }
  
  findAll(): ExampleEntity[] {
    return this.db.prepare('SELECT * FROM examples').all();
  }
}
```

### 2. **Lifecycle Hooks**
- `OnModuleInit`: Conecta a la BD al iniciar
- `OnModuleDestroy`: Cierra la conexión al finalizar

### 3. **Auto-inicialización**
La BD se crea automáticamente si no existe, con datos de ejemplo.

### 4. **Prepared Statements**
Previene inyección SQL y mejora performance.

## 🔧 Cómo Replicar para Chat (con BD)

### Paso 1: Agregar dependencias
```bash
cd backend/services/chat
npm install better-sqlite3
npm install -D @types/better-sqlite3
```

### Paso 2: Crear script de BD
```bash
# Copiar y adaptar
cp backend/services/example/src/db/example-db.sh \
   backend/services/chat/src/db/chat-db.sh

# Editar para crear tablas de chat:
# - conversations
# - messages  
# - participants
```

### Paso 3: Crear DatabaseService
```bash
cp backend/services/example/src/database.service.ts \
   backend/services/chat/src/database.service.ts
```

### Paso 4: Adaptar queries
```typescript
// Ejemplo para chat
createMessage(conversationId, userId, text) {
  const stmt = this.db.prepare(`
    INSERT INTO messages (conversation_id, user_id, text) 
    VALUES (?, ?, ?)
  `);
  return stmt.run(conversationId, userId, text);
}
```

### Paso 5: Registrar en el módulo
```typescript
@Module({
  providers: [DatabaseService, ChatService],
})
export class ChatModule {}
```

## 💾 Comandos de Base de Datos

### Ver datos directamente
```bash
sqlite3 backend/services/example/db/example.db "SELECT * FROM examples;"
```

### Abrir consola interactiva
```bash
sqlite3 backend/services/example/db/example.db
# Luego ejecutar comandos SQL
sqlite> .tables
sqlite> SELECT * FROM examples;
sqlite> .exit
```

### Resetear desde cero
```bash
rm backend/services/example/db/example.db
npm run db:init
```

## 📚 Recursos

- [better-sqlite3 docs](https://github.com/WiseLibs/better-sqlite3)
- [NestJS Lifecycle Events](https://docs.nestjs.com/fundamentals/lifecycle-events)
- [SQL Tutorial](https://www.sqlitetutorial.net/)

## ✅ Checklist

- ✅ Gateway configurado con ClientsModule
- ✅ Servicio con send() y emit()
- ✅ Controlador con validación de DTOs
- ✅ Microservicio escuchando en TCP
- ✅ @MessagePattern implementados
- ✅ @EventPattern implementados
- ✅ **Base de datos SQLite configurada**
- ✅ **DatabaseService con CRUD completo**
- ✅ **Script de inicialización de BD**
- ✅ **Auto-inicialización al arrancar**

## 🏗️ Estructura

### Gateway (HTTP → TCP)
```
backend/gateway/src/services/example/
├── example.module.ts        → Registra ClientsModule con TCP
├── example.controller.ts    → Endpoints REST (POST/GET)
├── example.service.ts       → Lógica de comunicación con microservicio
├── dto/
│   └── dto.ts              → Validación con class-validator
└── interfaces/
    └── example-service.interface.ts → Tipos y patrones
```

### Microservicio (TCP Listener)
```
backend/services/example/src/
├── main.ts                  → Servidor TCP en puerto 3005
├── example.module.ts        → Módulo del microservicio
├── example.controller.ts    → @MessagePattern y @EventPattern
└── example.service.ts       → Lógica de negocio
```

## 🔄 Flujo de Comunicación

```
Cliente HTTP
    │
    ▼
POST /example { name: "Test" }
    │
    ▼
Gateway (ExampleController)
    │
    ▼
ExampleService.createExample(dto)
    │
    ▼
ClientProxy.send('create-example', dto) ← TCP
    │
    ▼
Microservicio Example (puerto 3005)
    │
    ▼
@MessagePattern('create-example')
    │
    ▼
ExampleService.create(data)
    │
    ▼
Retorna { id, name, createdAt }
    │
    ▼
Cliente recibe respuesta
```

## 📡 Patrones Implementados

### Request-Response (send)
```typescript
// Gateway
const result = await this.client.send('create-example', data);

// Microservicio
@MessagePattern('create-example')
handleCreate(data) { return { ...data, id: '1' }; }
```

### Fire-and-Forget (emit)
```typescript
// Gateway
this.client.emit('example.created', data);

// Microservicio
@EventPattern('example.created')
handleEvent(data) { console.log('Event received'); }
```

## 🧪 Endpoints Disponibles

### POST /example
Crear un nuevo ejemplo
```bash
curl -X POST http://localhost:3000/example \
  -H "Content-Type: application/json" \
  -d '{"name":"Mi Ejemplo","description":"Test"}'
```

### GET /example
Obtener todos los ejemplos
```bash
curl http://localhost:3000/example
```

### GET /example/:id
Obtener un ejemplo por ID
```bash
curl http://localhost:3000/example/1
```

## 🎓 Conceptos Clave

### 1. **ClientsModule.register()**
Registra el cliente TCP en el módulo del Gateway para comunicarse con el microservicio.

### 2. **@Inject(MICROSERVICE_TOKEN)**
Inyecta el ClientProxy en el servicio para enviar mensajes.

### 3. **send() vs emit()**
- `send()`: Espera respuesta (request-response)
- `emit()`: No espera respuesta (evento)

### 4. **@MessagePattern() vs @EventPattern()**
- `@MessagePattern()`: Debe retornar un valor
- `@EventPattern()`: Solo procesa, no retorna

### 5. **ValidationPipe**
Valida automáticamente los DTOs con decoradores de `class-validator`.

## 🔧 Cómo Replicar para Chat

1. **Copiar la estructura del example**
2. **Renombrar:**
   - `ExampleModule` → `ChatModule`
   - `ExampleService` → `ChatService`
   - `CreateExampleDto` → `SendMessageDto`
3. **Actualizar patrones:**
   - `'create-example'` → `'send-message'`
   - `'get-examples'` → `'get-conversations'`
4. **Implementar lógica específica de chat**
5. **Registrar en AppModule**

## ✅ Checklist

- ✅ Gateway configurado con ClientsModule
- ✅ Servicio con send() y emit()
- ✅ Controlador con validación de DTOs
- ✅ Microservicio escuchando en TCP
- ✅ @MessagePattern implementados
- ✅ @EventPattern implementados
- ✅ Tipos e interfaces definidos
