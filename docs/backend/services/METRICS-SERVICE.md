# Métricas y Observabilidad

## Qué es esto

Esta es la capa de monitorización de Intragram. Recoge señales técnicas del backend, las guarda en Prometheus, las muestra en Grafana y envía alertas cuando algo falla o va más lento de lo normal.

## Explicación sencilla

Si no eres una persona muy técnica, la forma más simple de entenderlo es esta:

- Prometheus es el sistema que vigila la aplicación y guarda números sobre cómo se comporta.
- Grafana es el panel visual donde esos números se convierten en gráficas y cuadros de estado.
- Alertmanager es el sistema que manda avisos por correo cuando algo va mal.
- Los exporters son pequeños ayudantes que exponen métricas de las bases de datos, de Nginx o de la máquina.

Esto significa que el proyecto no solo “tiene Grafana instalado”. Realmente recoge datos, los muestra en paneles y puede avisarnos si un servicio se cae o empieza a fallar.

## Por qué esto cumple el módulo de 42

El requisito de Transcendence dice:

- Configurar Prometheus para recoger métricas.
- Configurar exporters e integraciones.
- Crear dashboards personalizados en Grafana.
- Configurar reglas de alertas.
- Proteger el acceso a Grafana.

Este proyecto hace cada una de esas cosas:

- Prometheus recoge métricas del gateway y de los tres servicios backend a través de `/metrics`.
- La pila incluye exporters para Node, PostgreSQL y Nginx.
- Grafana tiene dashboards personalizados para gateway, auth, users y chat.
- Prometheus tiene reglas de alertas y Alertmanager las envía por correo.
- Grafana está detrás de Nginx, requiere inicio de sesión y ya no expone acceso anónimo público.

## Arquitectura

- `Nginx` es la entrada pública por HTTPS.
- `/api/` va al `gateway`.
- `/grafana/` va a Grafana.
- `/prometheus/` va a Prometheus.
- `/alertmanager/` va a Alertmanager.
- `Prometheus` recoge las métricas internamente.
- `Grafana` lee los datos desde Prometheus.
- `Alertmanager` envía notificaciones por correo cuando saltan las alertas.

## Componentes

### Prometheus

Prometheus recoge métricas de:

- `gateway:3000`
- `auth-service:3003`
- `users-service:3006`
- `chat-service:3009`
- `node-exporter`
- `postgres-exporter-auth`
- `postgres-exporter-users`
- `postgres-exporter-chat`
- `nginx-exporter`

También carga las reglas de alertas desde `backend/observability/prometheus/rules.yml`.

### Grafana

Grafana carga automáticamente su datasource y el provisionado de dashboards:

- datasource: Prometheus
- dashboards: gateway, auth, users, chat

Cada dashboard tiene un filtro `Instance` para poder elegir el target sin editar el JSON.

### Alertmanager

Alertmanager recibe las alertas de Prometheus y las envía por correo.

### Exporter de Nginx

Nginx expone `stub_status` internamente en el puerto `8080`, y el exporter lee ese endpoint.

## Qué métricas expone cada servicio

### Gateway

- histograma de duración de peticiones HTTP
- contador de peticiones por método, ruta y estado
- métricas de memoria y del event loop

### Auth, users y chat

Cada servicio expone:

- `http_request_duration_seconds`
- `request_count_total`
- métricas por defecto del proceso Node

Eso es suficiente para que Prometheus detecte latencia, errores y disponibilidad del servicio.

## Rutas de acceso

Todo queda detrás de Nginx:

- Grafana: `https://localhost:8443/grafana/`
- Prometheus: `https://localhost:8443/prometheus/`
- Alertmanager: `https://localhost:8443/alertmanager/`

## Inicio rápido

```bash
docker compose up -d --build
```

Después abre:

- `https://localhost:8443/grafana/`
- `https://localhost:8443/prometheus/`
- `https://localhost:8443/alertmanager/`

## Qué comprobar

```bash
docker compose config
docker compose ps
docker compose logs -f prometheus alertmanager grafana
```

Comprueba que Prometheus ve los targets:

```bash
curl -k https://localhost:8443/prometheus/api/v1/targets | jq '.data.activeTargets[] | {job: .labels.job, instance: .labels.instance, health: .health}'
```

Comprueba que los servicios responden en `/metrics`:

```bash
curl http://localhost:3000/metrics
curl http://localhost:3003/metrics
curl http://localhost:3006/metrics
curl http://localhost:3009/metrics
```

## Prueba del flujo de alertas

Puedes inyectar una alerta sintética en Alertmanager para probar el envío por correo:

```bash
curl -k -X POST https://localhost:8443/alertmanager/api/v2/alerts \
  -H 'Content-Type: application/json' \
  -d '[{
    "labels": {
      "alertname": "ManualTestAlert",
      "severity": "warning",
      "job": "manual-test",
      "instance": "localhost"
    },
    "annotations": {
      "summary": "Alerta sintética para verificar la entrega"
    },
    "startsAt": "2026-05-25T00:00:00Z"
  }]'
```

Después verifica que la alerta existe:

```bash
curl -k https://localhost:8443/alertmanager/api/v2/alerts | jq
```

## Por qué esto es suficientemente seguro para el módulo

- Grafana no permite acceso anónimo.
- Grafana requiere usuario y contraseña desde `.env`.
- Grafana se sirve detrás de Nginx con HTTPS.
- Prometheus y Alertmanager ya no están expuestos como puertos públicos.
- Los valores sensibles se guardan en `.env`, que Git ignora.

## Si algo falla

Si los avisos por correo no llegan, revisa:

- los valores `ALERTMANAGER_*` en `.env`
- la conectividad con SMTP
- los logs de Alertmanager

Si un dashboard no muestra datos, revisa:

- que los targets de Prometheus estén en estado `UP`
- que el `Instance` seleccionado coincida con un target realmente scrapeado

## Archivos relacionados

- `backend/gateway/src/observability/metrics/metrics.service.ts`
- `backend/gateway/src/common/interceptors/metrics.interceptor.ts`
- `backend/observability/prometheus/prometheus.yml`
- `backend/observability/prometheus/rules.yml`
- `backend/observability/prometheus/alertmanager.yml`
- `backend/observability/grafana/datasource.yml`
- `backend/observability/grafana/dashboard.yml`
- `backend/observability/grafana/dashboards/*.json`