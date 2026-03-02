# Gateway FAQ

Preguntas y respuestas sobre cómo fluye el tráfico entre `nginx`, `gateway` y microservicios.

---

## 1) ¿Hago un reverse proxy desde el gateway al microservice `example`?

Sí, pero a nivel de aplicación.

- El `gateway` recibe peticiones HTTP.
- Luego reenvía la petición al microservicio `example`.

### ¿Dónde ocurre?

- Entrada HTTP en `gateway/src/services/example/example.controller.ts` (`POST /example`, `GET /example`, `GET /example/:id`).
- Reenvío del gateway al servicio en `gateway/src/services/example/example.service.ts`.
- Configuración de URLs internas en `gateway/src/config/microservices.config.ts`.
- Recepción en el microservicio en `services/example/src/example.controller.ts`.

---

## 2) ¿Cómo que gateway recibe HTTP? ¿No se suponía que nginx recibía HTTP y convertía a HTTPS?

Las dos cosas son ciertas, pero en capas distintas:

- `nginx` recibe HTTPS desde el cliente (puerto 443 dentro del contenedor, publicado como `8443` en host).
- `nginx` hace proxy hacia `gateway` en la red interna Docker.
- El `gateway` sigue siendo un servidor HTTP interno de Nest (`app.listen(...)`).

En resumen:

- **Cliente externo** → HTTPS → `nginx`
- **Tráfico interno Docker** → HTTP → `gateway`

Además, `nginx` envía cabeceras `X-Forwarded-*` para que el backend conozca el esquema/proxy original.

---

## 3) ¿Por qué antes gateway estaba en TCP y tuvimos que cambiar `example-service` a HTTP?

Porque antes el flujo usaba transporte de microservicios de Nest (TCP + patrones de mensajes), y ahora se migró a comunicación HTTP entre servicios.

Estado actual:

- `example-service` expone endpoints HTTP.
- `gateway` consume esos endpoints por HTTP.
- Se eliminó la dependencia de TCP en el código activo para este flujo.

Ventaja práctica: simplifica integración con observabilidad (`/metrics`, Prometheus) y hace más directo el troubleshooting con `curl` y logs HTTP.