Validación mínima y completa.

**En navegador (usuario final)**
- Abre `https://localhost:8443` y verifica certificado (si es self-signed, aviso del navegador es normal).
- Prueba `https://localhost:8443/api/test` → debe responder `200` (ruta de health del gateway vía Nginx).
- Prueba `https://localhost:8443/api/example` → debe responder `200` con JSON (lista, aunque sea vacía).
- Auth (desde cliente API: Postman/Insomnia/cURL):
  - `POST https://localhost:8443/api/auth/register` → `201` con `access_token` y `refresh_token`.
  - `POST https://localhost:8443/api/auth/login` → `200` con `access_token` y `refresh_token`.
  - `POST https://localhost:8443/api/auth/refresh` → `200` con nuevos tokens.
  - `POST https://localhost:8443/api/auth/logout` → `200` con mensaje de éxito.
  - Nota: abrir `https://localhost:8443/api/auth/register` en navegador hace `GET` y debe devolver `404` (`Cannot GET /auth/register`).
- Si tienes frontend detrás de Nginx, revisa en DevTools que todas las llamadas API salgan a `https://localhost:8443/api/...` (no a puertos internos).

**En terminal (infra y red)**
- Estado general: `docker compose ps` → todos `Up` (idealmente `healthy` donde aplica).
- Logs clave: `docker compose logs -f nginx gateway example-service auth-service auth-db prometheus grafana` → sin errores recurrentes.
- Proxy HTTPS funcionando:  
  - `curl -k -i https://localhost:8443/api/test`  
  - `curl -k -i https://localhost:8443/api/example`
- Crear/leer dato de ejemplo:
  - `curl -k -X POST https://localhost:8443/api/example -H "Content-Type: application/json" -d '{"name":"demo"}'`
  - `curl -k https://localhost:8443/api/example`
- Flujo auth end-to-end:
  - `TS=$(date +%s)`
  - `curl -k -i -X POST https://localhost:8443/api/auth/register -H "Content-Type: application/json" -d '{"username":"demo_'"$TS"'","email":"demo_'"$TS"'@test.local","password":"Demo123!","display_name":"Demo"}'`
  - `curl -k -i -X POST https://localhost:8443/api/auth/login -H "Content-Type: application/json" -d '{"identifier":"demo_'"$TS"'","password":"Demo123!"}'`
  - Copia el `refresh_token` de la respuesta anterior y prueba:
    - `curl -k -i -X POST https://localhost:8443/api/auth/refresh -H "Content-Type: application/json" -d '{"refresh_token":"<PEGA_AQUI_REFRESH_TOKEN>"}'`
    - `curl -k -i -X POST https://localhost:8443/api/auth/logout -H "Content-Type: application/json" -d '{"refresh_token":"<PEGA_AQUI_REFRESH_TOKEN>"}'`
- Verificar que NO hay bypass directo (esto debe fallar):  
  - `curl -i http://localhost:3000`  
  - `curl -i http://localhost:3003`  
  - `curl -i http://localhost:3005`  
  - `curl -i http://localhost:9090`  
  - `curl -i http://localhost:3001`
- Verificación extra (esperado que falle desde host):
  - `curl -i http://localhost:3003/metrics` → conexión rechazada (no se expone puerto interno).

**Monitoreo interno (sin exponer puertos)**
- Nginx config OK: `docker compose exec nginx nginx -t`
- Prometheus scrape interno:
  - `docker compose exec prometheus wget -qO- http://localhost:9090/api/v1/targets`
  - En output, tus targets (`gateway`, `example-service`, `auth-service`) deben aparecer `up`.
- Métricas de servicios desde red interna:
  - `docker compose exec prometheus wget -qO- http://gateway:3000/metrics | head`
  - `docker compose exec prometheus wget -qO- http://example-service:3005/metrics | head`
  - `docker compose exec prometheus wget -qO- http://auth-service:3003/metrics | head`


**Prometheus (terminal)**

- Estado del contenedor: docker compose ps prometheus
- Config cargada y proceso vivo: docker compose logs --tail 80 prometheus
- Targets scrapeados:
  - docker compose exec prometheus wget -qO- http://localhost:9090/api/v1/targets
- Query rápida de disponibilidad:
  - docker compose exec prometheus wget -qO- "http://localhost:9090/api/v1/query?query=up"
- Query específica de tus servicios:
  - docker compose exec prometheus wget -qO- "http://localhost:9090/api/v1/query?query=up%7Bjob%3D%22nestjs_app%22%7D"
  - docker compose exec prometheus wget -qO- "http://localhost:9090/api/v1/query?query=up%7Binstance%3D%22auth-service%3A3003%22%7D"
- Prueba en navegador:
  - https://localhost:8443/prometheus/
  - https://localhost:8443/grafana/
- Validación rápida terminal:
  - curl -k -I https://localhost:8443/prometheus/
  - curl -k -I https://localhost:8443/grafana/

