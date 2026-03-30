## Página HOME

Esta página es la vista principal de Intragram una vez que el usuario ha iniciado sesión correctamente.

### ¿Qué hace esta página?

- **Verifica que el usuario esté autenticado**: solo se puede acceder a esta página después de pasar por el flujo de login. La ruta está protegida en App.tsx.
- **Obtiene la identidad del usuario** usando el contexto de autenticación (`useAuth`).
	- Lee el **token de acceso** (JWT) almacenado en el navegador.
	- Recupera el **login real** del usuario (por ejemplo `login` de 42) y, cuando está disponible, su **perfil completo** del microservicio de usuarios.
- **Muestra una barra de navegación superior (Navbar)** en escritorio:
	- Enseña el logo de Intragram.
	- Permite buscar perfiles mediante un cuadro de búsqueda.
	- Muestra el resumen del usuario conectado (inicial, login y datos derivados del perfil, como puntos de corrección).
	- Incluye un menú central con pestañas: *Home*, *Chat* y *Notifs*.
- **Muestra un encabezado simplificado en móvil**:
	- Logo de Intragram.
	- Barra de búsqueda rápida.
	- Un botón circular con la **inicial real** del usuario conectado (no es un dato inventado).
- **Organiza el contenido principal en tres columnas (según el tamaño de pantalla)**:
	- **Columna izquierda (Sidebar, solo escritorio)**: selector de filtros del feed (Reciente, Amigos, Seguidos, Trending, Mi perfil).
	- **Columna central (contenido principal)**:
		- Si la pestaña activa es **Home**, muestra el componente de **Feed** con la lista de publicaciones.
		- Si la pestaña activa es **Notifs**, muestra la página de **Notificaciones**.
		- Si la pestaña activa es **Chat**, cambia a la vista completa del **Chat**.
	- **Columna derecha (FriendsList, solo escritorio ancho)**: lista lateral de amigos simulados (usuarios conectados, con nivel y estado online).
- **Incluye una barra inferior (BottomBar) en móvil**:
	- Permite cambiar entre Home, Chat y Notificaciones.
	- Ofrece acceso rápido a los filtros.
- **Administra ventanas modales y paneles laterales**:
	- **FilterDrawer**: panel lateral para elegir el filtro del feed en móvil.

### ¿Qué datos reales usa y cuáles son de ejemplo?

- Datos **reales**:
	- El login del usuario autenticado y su perfil se obtienen a partir del token JWT y del microservicio de usuarios.
	- La inicial que aparece en los avatares de la cabecera se genera a partir de ese login/nombre real.
- Datos **de ejemplo (mock)**:
	- El contenido del **feed** (publicaciones, likes, comentarios) todavía se basa en datos simulados, pensados para maquetar la interfaz.
	- La **lista de amigos** (FriendsList) también usa usuarios de prueba, no conecta aún con un backend de “amigos reales”.

### Comportamiento técnico (alto nivel, sin código)

1. Cuando el usuario llega a HOME, ya existe un **token de sesión** guardado en el navegador.
2. El contexto de autenticación interpreta ese token y extrae el **usuario básico** (id, username, email, display_name).
3. Con ese usuario, el frontend pide al microservicio de usuarios su **perfil completo** (login normalizado, avatar, puntos de corrección, etc.).
4. Con esta información se personalizan:
	 - El avatar y login mostrados en la Navbar.
	 - La inicial del botón de usuario en el header móvil.
	 - El filtro "Mi perfil" del feed, que ahora usa el login real del usuario para mostrar solo sus publicaciones (aunque hoy en día esas publicaciones siguen siendo de ejemplo).

### Pendiente / TODO de la página HOME

- Conectar el **feed** con un backend real de publicaciones, de forma que:
	- Las tarjetas de post muestren mensajes y métricas reales guardadas en base de datos.
	- El filtro **"Mi perfil"** liste solo posts creados por el usuario autenticado, pero usando datos reales y no la colección mock.
- Conectar la **lista de amigos (FriendsList)** con datos reales de usuarios/amigos/seguidores en lugar de una lista fija de ejemplo.
- Integrar el **estado de sesión** (por ejemplo, botón de cerrar sesión) en la interfaz de HOME para que un usuario no técnico pueda salir de la aplicación fácilmente.
