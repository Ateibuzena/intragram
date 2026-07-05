# Nginx Service

## Purpose

`nginx` es el punto de entrada absoluto del stack. Termina TLS y distribuye el tráfico a frontend, gateway y herramientas de observabilidad.

## Routing

- `/`
  - se reenvía al contenedor `frontend`
- `/api/`
  - se reenvía al `gateway`
- `/prometheus/`
  - se reenvía a `prometheus`
- `/grafana/`
  - se reenvía a `grafana`

## TLS

- Escucha en `443`
- Usa certificado y clave montados en:
  - `/etc/nginx/ssl/nginx.crt`
  - `/etc/nginx/ssl/nginx.key`

## Why It Matters In This Project

- Unifica frontend y backend bajo el mismo origen.
- Reduce problemas de CORS y de configuración en el cliente.
- Permite exponer Prometheus y Grafana bajo subrutas del mismo host.
- Simplifica el acceso local del evaluador.

## WebSocket Readiness

La configuración ya incluye headers `Upgrade` y `Connection` para soportar tráfico compatible con WebSocket tanto en la raíz como en `/api/`.

## Operational Notes

- Puerto publicado: `${NGINX_HTTPS_PORT}:443`
- Configuración principal: `backend/nginx/config/nginx.conf`

## Relevant Files

- `backend/nginx/config/nginx.conf`
- `backend/nginx/Dockerfile`
- `docker-compose.yml`
