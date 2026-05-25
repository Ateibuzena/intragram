# 1. Requisitos Generales

Construir un proyecto completo es complicado y muchas cosas pueden salir mal. Para ayudarte, te proporcionamos una lista de requisitos generales.

Los requisitos son los siguientes:

- El proyecto debe ser una aplicación web y requiere frontend, backend y base de datos.
- Se debe usar Git con mensajes de commit claros y significativos. El repositorio debe mostrar:
  - Commits de todos los miembros del equipo.
  - Mensajes de commit claros que describan los cambios.
  - Distribución adecuada del trabajo entre el equipo.
- El despliegue debe utilizar una solución de contenedorización (Docker, Podman o equivalente) y ejecutarse con un único comando.
- Tu sitio web debe ser compatible con la versión estable más reciente de Google Chrome.
- No deben aparecer advertencias ni errores en la consola del navegador.
- El proyecto debe incluir páginas accesibles de Política de Privacidad y Términos de Servicio con contenido relevante.

### Política de Privacidad y Términos de Servicio

Estas páginas serán verificadas durante la evaluación. Deben:

- Ser fácilmente accesibles desde la aplicación (por ejemplo, enlaces en el pie de página).
- Contener contenido relevante y apropiado para tu proyecto.
- No ser páginas de relleno ni vacías.

> ⚠️ La ausencia de páginas de Política de Privacidad/Términos de Servicio, o que sean inadecuadas, provocará el rechazo del proyecto.

### Soporte Multiusuario (Obligatorio)

Tu sitio web debe soportar múltiples usuarios simultáneamente. Este es un requisito central del proyecto. Los usuarios deben poder interactuar con la aplicación al mismo tiempo sin conflictos ni problemas de rendimiento. Esto incluye:

- Múltiples usuarios conectados y activos al mismo tiempo.
- Acciones concurrentes de distintos usuarios gestionadas correctamente.
- Actualizaciones en tiempo real reflejadas en todos los usuarios conectados cuando aplique.
- Ausencia de corrupción de datos o condiciones de carrera durante acciones simultáneas.

---

# 2. Requisitos Técnicos

Esta sección, al igual que la anterior, es obligatoria. Luego podrás elegir los módulos que quieras usar en el siguiente capítulo.

- Un frontend claro, responsive y accesible en todos los dispositivos.
- Usar un framework CSS o solución de estilos de tu elección (por ejemplo: Tailwind CSS, Bootstrap, Material-UI, Styled Components, etc.).
- Guardar credenciales (API keys, variables de entorno, etc.) en un archivo local .env ignorado por Git, y proporcionar un archivo .env.example.
- La base de datos debe tener un esquema claro y relaciones bien definidas.
- Tu aplicación debe tener un sistema básico de gestión de usuarios. Los usuarios deben poder registrarse e iniciar sesión de forma segura:
  - Como mínimo: autenticación por email y contraseña con seguridad adecuada (passwords hasheadas, salting, etc.).
  - Métodos adicionales de autenticación (OAuth, 2FA, etc.) pueden implementarse vía módulos.
- Todos los formularios y entradas de usuario deben validarse correctamente tanto en frontend como en backend.
- Cualquier conexión al backend, desde un navegador, script, API externa, etc., debe usar HTTPS. Las conexiones internas del backend (por ejemplo, entre servidor web y base de datos, o software dentro de los contenedores) pueden no ir cifradas.

### ¿Qué es un Framework?

Para este proyecto, un framework se define como una herramienta integral que proporciona:

- Una arquitectura estructurada y convenciones para organizar el código.
- Funcionalidades integradas para tareas comunes (routing, gestión de estado, etc.).
- Un ecosistema completo de herramientas y librerías.

**Ejemplos:**

- **Frameworks de frontend:** React, Vue, Angular, Svelte, Next.js (todos cuentan como frameworks).
- **Frameworks de backend:** Express, Fastify, NestJS, Django, Flask, Ruby on Rails.
- **No son frameworks:** jQuery (librería), Lodash (librería utilitaria), Axios (cliente HTTP).

> **Nota:** React se considera framework en este contexto por su ecosistema y patrones de arquitectura, aunque técnicamente sea una librería.

---

# 3. Módulos

## 🔴 Módulos Mayores

### Frameworks (Frontend y Backend)
Usar un framework tanto para frontend como para backend.
- Usar un framework de frontend (React, Vue, Angular, Svelte, etc.).
- Usar un framework de backend (Express, NestJS, Django, Flask, Ruby on Rails, etc.).
- Los frameworks full-stack (Next.js, Nuxt.js, SvelteKit) cuentan como ambos si usas tanto su capacidad frontend como backend.

### Funcionalidades en Tiempo Real
Implementar funcionalidades en tiempo real usando WebSockets o tecnología similar.
- Actualizaciones en tiempo real entre clientes.
- Manejar conexión/desconexión de forma correcta.
- Difusión de mensajes eficiente.

### Interacción entre Usuarios
Permitir que los usuarios interactúen con otros usuarios. Requisitos mínimos:
- Sistema básico de chat (enviar/recibir mensajes entre usuarios).
- Sistema de perfil (ver información de usuario).
- Sistema de amistades (agregar/eliminar amigos, ver lista de amigos).

### API Pública
Una API pública para interactuar con la base de datos con API key segura, rate limiting, documentación y al menos 5 endpoints:
- GET /api/{something}
- POST /api/{something}
- PUT /api/{something}
- DELETE /api/{something}

### Gestión Estándar de Usuarios y Autenticación
- Los usuarios pueden actualizar su información de perfil.
- Los usuarios pueden subir un avatar (con avatar por defecto si no se sube uno).
- Los usuarios pueden agregar a otros usuarios como amigos y ver su estado en línea.
- Los usuarios tienen una página de perfil con su información.

### WAF/ModSecurity + HashiCorp Vault
Implementar WAF/ModSecurity (endurecido) + HashiCorp Vault para secretos:
- Configurar ModSecurity/WAF estricto.
- Gestionar secretos en Vault (API keys, credenciales, variables de entorno), cifrados y aislados.

### Sistema de Monitoreo ✅
Sistema de monitoreo con Prometheus y Grafana.
- Configurar Prometheus para recolectar métricas.
- Configurar exporters e integraciones.
- Crear dashboards personalizados de Grafana.
- Configurar reglas de alerta.
- Asegurar el acceso a Grafana.

### Backend como Microservicios ✅
- Diseñar servicios desacoplados con interfaces claras.
- Usar APIs REST o colas de mensajes para la comunicación.
- Cada servicio debe tener una única responsabilidad.

Ver más documentación en [MICROSERVICES](MICROSERVICES.md)

### Dashboard de Analítica Avanzada
Dashboard de analítica avanzada con visualización de datos.
- Gráficos interactivos (línea, barras, torta, etc.).
- Actualizaciones en tiempo real.
- Funcionalidad de exportación (PDF, CSV, etc.).
- Rangos de fecha y filtros personalizables.

---

## 🟡 Módulos Menores

### Sistema de Diseño Personalizado
Sistema de diseño propio con componentes reutilizables, incluyendo una paleta de colores adecuada, tipografía e íconos (mínimo: 10 componentes reutilizables).

### Búsqueda Avanzada
Implementar funcionalidad de búsqueda avanzada con filtros, ordenamiento y paginación.

### OAuth 2.0
Implementar autenticación remota con OAuth 2.0 (Google, GitHub, 42, etc.).

### Analítica de Actividad de Usuario
Dashboard de analítica e insights de actividad de usuarios.
