¿hago un reverse proxy desde el gateway al microservice example? ¿como se está haciendo y en qué archivo?

Sí, ya lo estás haciendo, pero no como reverse proxy HTTP clásico tipo Nginx.
Tu gateway actúa como proxy de aplicación: recibe HTTP y reenvía por transporte TCP al microservicio example usando patrones de mensajes.

Dónde ocurre

Entrada HTTP en example.controller.ts: endpoints POST /example, GET /example, GET /example/:id.
Reenvío al microservicio en example.service.ts: usa ClientProxy.send(...) con patrones create-example, get-examples, get-example-by-id, y emit(...) para eventos.
Cliente del microservicio registrado en example.module.ts con ClientsModule.register(...).
Config de conexión (host/port TCP) en microservices.config.ts.
Lado receptor en example.controller.ts: @MessagePattern(...) y @EventPattern(...).
Microservicio levantado en modo TCP en main.ts.

¿ como que gateway recibe http? no se supone que mi nginx recibia http y convertia a https y mandaba a gateway?

las dos cosas son ciertas a la vez.

nginx recibe la conexión HTTPS del cliente en nginx.conf (listen 443 ssl;).
En /api/, nginx hace proxy_pass http://gateway/ hacia el upstream gateway:3000, también en nginx.conf.
El gateway es una app Nest HTTP normal y escucha en 3000 con app.listen(...), en main.ts.
Por eso el gateway “recibe HTTP”, pero HTTP interno (de nginx a gateway), mientras que el cliente externo usa HTTPS.
Además, nginx envía X-Forwarded-Proto: $scheme para que el backend sepa que el cliente original vino por HTTPS, en nginx.conf.

¿porque gateway esta en tcp y ayer tuvimos que cambiar example-service a http?