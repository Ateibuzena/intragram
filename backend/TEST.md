Validación mínima y completa.

**En navegador (usuario final)**
- Abre `https://localhost:8443` y verifica certificado (si es self-signed, aviso del navegador es normal).
- Prueba `https://localhost:8443/api/test` → debe responder `200` (ruta de health del gateway vía Nginx).
- Prueba `https://localhost:8443/api/example` → debe responder `200` con JSON (lista, aunque sea vacía).
- Si tienes frontend detrás de Nginx, revisa en DevTools que todas las llamadas API salgan a `https://localhost:8443/api/...` (no a puertos internos).

**En terminal (infra y red)**
- Estado general: `docker compose ps` → todos `Up` (idealmente `healthy` donde aplica).
- Logs clave: `docker compose logs -f nginx gateway example-service prometheus grafana` → sin errores recurrentes.
- Proxy HTTPS funcionando:  
  - `curl -k -i https://localhost:8443/api/test`  
  - `curl -k -i https://localhost:8443/api/example`
- Crear/leer dato de ejemplo:
  - `curl -k -X POST https://localhost:8443/api/example -H "Content-Type: application/json" -d '{"name":"demo"}'`
  - `curl -k https://localhost:8443/api/example`
- Verificar que NO hay bypass directo (esto debe fallar):  
  - `curl -i http://localhost:3000`  
  - `curl -i http://localhost:3005`  
  - `curl -i http://localhost:9090`  
  - `curl -i http://localhost:3001`

**Monitoreo interno (sin exponer puertos)**
- Nginx config OK: `docker compose exec nginx nginx -t`
- Prometheus scrape interno:
  - `docker compose exec prometheus wget -qO- http://localhost:9090/api/v1/targets`
  - En output, tus targets (`gateway`, `example-service`) deben aparecer `up`.
- Métricas de servicios desde red interna:
  - `docker compose exec prometheus wget -qO- http://gateway:3000/metrics | head`
  - `docker compose exec prometheus wget -qO- http://example-service:3005/metrics | head`
