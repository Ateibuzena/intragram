# Metrics And Observability

## Purpose

La capa de observabilidad del proyecto permite verificar salud, rendimiento básico y disponibilidad de los servicios.

## Components

- `Prometheus`
  - recolecta métricas de los servicios NestJS y del gateway.
- `Grafana`
  - visualiza las métricas mediante dashboards provisionados.
- `Gateway metrics service`
  - expone histogramas, gauge de usuarios activos y contador de peticiones.

## Scrape Targets

Prometheus está configurado para consultar:

- `gateway:3000`
- `auth-service:3003`
- `users-service:3006`
- `chat-service:3009`

## Available Dashboards

El repositorio contiene dashboards JSON para:

- gateway
- auth-service
- users-service
- chat-service

## Exposed Paths Through Nginx

- Prometheus
  - `https://localhost:8443/prometheus/`
- Grafana
  - `https://localhost:8443/grafana/`

## Metrics Captured In Gateway

- duración de peticiones HTTP,
- total de peticiones por método/ruta/status,
- gauge de usuarios activos.

## Current Limitations

- El gauge de usuarios activos en gateway es todavía muy básico.
- No hay alerting configurado.
- La cobertura de métricas es mejor en infraestructura que en negocio.

## Relevant Files

- `backend/gateway/src/observability/metrics/metrics.service.ts`
- `backend/gateway/src/common/interceptors/metrics.interceptor.ts`
- `backend/observability/prometheus/prometheus.yml`
- `backend/observability/grafana/dashboard.yml`
- `backend/observability/grafana/datasource.yml`
- `backend/observability/grafana/dashboards/*.json`
