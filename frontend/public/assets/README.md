# Portfolio Web de Ana Zubieta

## Descripción
Este proyecto es un **portfolio web personal** que muestra mis proyectos académicos y profesionales, mis habilidades técnicas y permite contacto directo. Está diseñado para ser **ligero, moderno y responsive**, usando **HTML, Tailwind CSS y JavaScript puro** como tecnologías principales.  

El objetivo es, además, aprender y practicar herramientas que serán útiles para el proyecto **ft_transcendence** en 42 Málaga.

---

## Estructura del proyecto

```bash
portfolio/
├─ index.html          # Home / Intro
├─ projects.html       # Proyectos
├─ skills.html         # Skills / Tech Stack
├─ contact.html        # Contacto
├─ extras.html         # Mini pruebas con React
├─ css/
│   └─ styles.css      # Tailwind + estilos personalizados
├─ js/
│   ├─ main.js         # Scripts generales
│   └─ projects.js     # Funciones para mostrar proyectos (API GitHub)
├─ assets/
│   ├─ images/
│   └─ icons/
├─ node_modules/       # Dependencias Node.js (si se usa backend)
├─ server.js           # Backend con Fastify (opcional)
└─ package.json        # Dependencias Node.js
```
---

## Tecnologías usadas

- **HTML5**: estructura semántica y accesibilidad  
- **Tailwind CSS**: estilos modernos y responsive  
- **JavaScript puro**: interactividad, consumo de APIs, animaciones  
- **React (opcional)**: mini experimentos y componentes dinámicos  
- **Node.js + Fastify **: backend ligero para login y endpoints personalizados  

---

## Cómo ejecutar el proyecto

1. Clonar el repositorio:  
```bash
git clone <URL_DEL_REPO>
cd portfolio
```

2. Abrir index.html en un navegador para ver el Home

3. Backend:
```bash
npm install
node server.js
```
---

## 🚀 Roadmap paso a paso

### Paso 1: Base HTML + Tailwind CSS

- Configurar Tailwind con PostCSS o CDN.

- Crear index.html con tu presentación.

- Crear una navbar básica con links a cada sección.

- Footer con contacto básico.

Mini reto: que el Home tenga una animación ligera (fade-in) al cargar.

### Paso 2: Proyectos

- Crear projects.html y tarjetas para cada proyecto.

- Tarjetas con: nombre, descripción, tecnologías, link a GitHub.

- Consumir la API de GitHub para mostrar repositorios directamente (esto entra en JS puro).

Mini reto: que al hacer hover sobre la tarjeta, se muestre un mini resumen más largo o animación.

### Paso 3: Skills / Tech Stack

- Mostrar iconos de tus skills (HTML, CSS, JS, Python, C…)

- Usar iconos de FontAwesome o imágenes propias.

- Organizar en categorías: Frontend / Backend / Data Science

Mini reto: barra de progreso animada para cada skill.

### Paso 4: Contacto

- Formulario básico: nombre, email, mensaje.

- Integrar EmailJS para recibir mensajes sin backend.

- Validación simple con JS (email válido, campos obligatorios).

Mini reto: que al enviar, se muestre un toast de confirmación animado.

### Paso 5: Extras / React

- Crear extras.html y probar mini componentes React dentro de tu portfolio.
  Ejemplo: un contador, toggle dark/light mode, o fetch de una API.

Mini reto: un pequeño proyecto React embebido para mostrar mis progresos.

### Paso 6: Backend (Node.js + Fastify, opcional)

- Mostrar login, guardar datos o integrar mis propios endpoints.

- Server simple con Fastify: endpoints como /login, /projects (para guardar mis proyectos en DB).

- DB ligera: SQLite o MongoDB si quiero experimentar.

Mini reto: endpoint que devuelva mis proyectos y los consuma projects.js para actualizar la UI automáticamente.

