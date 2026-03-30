## Página LOGIN

Esta página es la puerta de entrada a Intragram. Aquí es donde el usuario inicia sesión usando su cuenta de la red 42.

### ¿Qué hace esta página?

- **Presenta la marca de la aplicación**:
	- Muestra el nombre "Intragram" con el estilo visual principal.
	- Indica que es "La red social de la comunidad 42".
- **Ofrece un único botón de acceso**:
	- Botón "Entrar con 42" visible en el centro de la pantalla.
	- Este botón está pensado para que un usuario sin conocimientos técnicos pueda iniciar sesión con un solo clic.
- **Inicia el flujo de autenticación con 42**:
	- Al hacer clic en "Entrar con 42", el navegador es redirigido a una URL del backend (`/auth/42`).
	- Esa URL pertenece al **gateway** del backend, que a su vez contacta con el servicio de autenticación y con la API de 42.
- **Limita el acceso a miembros de la red 42**:
	- Debajo del botón se muestra un mensaje "Solo para estudiantes de la red 42" para dejar claro el público objetivo.

### Cómo funciona el login a nivel técnico (resumen)

1. La página construye la URL de login usando una utilidad centralizada (`buildApiUrl`), que se encarga de apuntar al dominio correcto del backend (por ejemplo, en desarrollo vs. producción).
2. Cuando el usuario pulsa "Entrar con 42":
	 - El navegador hace una petición HTTP GET a `API_BASE_URL/auth/42`.
	 - El gateway redirige al usuario a la pantalla oficial de login de 42 (OAuth).
3. Tras completar el login en 42, el usuario vuelve al backend, que:
	 - Valida las credenciales con 42.
	 - Crea o actualiza el usuario local en la base de datos.
	 - Genera un **token de acceso (JWT)** y una estructura con los datos básicos del usuario.
4. Finalmente, el backend **redirecciona al frontend** con una URL de este estilo:
	 - `FRONTEND_URL?token=...&user=...`
	 - `token` es el JWT que se guardará en el navegador.
	 - `user` contiene información básica (id, username, email, display_name).
5. El frontend, al detectar esos parámetros en la URL, guarda el token y el usuario en localStorage y redirige automáticamente a la página HOME.

### Qué ve y qué tiene que hacer el usuario

- Solo ve:
	- El logo y el nombre de Intragram.
	- Un texto corto que explica que es la red social de 42.
	- Un único botón "Entrar con 42".
- Solo tiene que:
	- Pulsar ese botón.
	- Completar el login en la pantalla oficial de 42.
	- A partir de ahí, ya será llevado automáticamente a la página principal (HOME) de Intragram.

### Pendiente / TODO de la página LOGIN

- Añadir mensajes de **error más explícitos** en el frontend cuando:
	- Falla el inicio del flujo OAuth (por ejemplo, si `?error=oauth_init_failed`).
	- Vuelve el usuario con un error de autenticación (`?error=auth_failed` o códigos similares).
- Mostrar algún tipo de **indicador de carga** mientras se redirige al servicio de 42 (para que el usuario sepa que algo está ocurriendo tras pulsar el botón).
