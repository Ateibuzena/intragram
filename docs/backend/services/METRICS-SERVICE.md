# Métricas y Observabilidad

## Qué es esto

Esta es la capa de monitorización de Intragram. Recoge señales técnicas del backend, las guarda en Prometheus y las muestra en Grafana.

## Explicación sencilla

Si no eres una persona muy técnica, la forma más simple de entenderlo es esta:

- Prometheus es el sistema que vigila la aplicación y guarda números sobre cómo se comporta.
- Grafana es el panel visual donde esos números se convierten en gráficas y cuadros de estado.
- Node exporter es el ayudante que expone métricas de la máquina.

Esto significa que el proyecto no solo “tiene Grafana instalado”. Realmente recoge datos y los muestra en paneles.

## Por qué esto cumple el módulo de 42

El requisito de Transcendence dice:

- Configurar Prometheus para recoger métricas.
- Configurar exporters e integraciones.
- Crear dashboards personalizados en Grafana.
- Configurar reglas de alertas.
- Proteger el acceso a Grafana.

Este proyecto hace cada una de esas cosas:

- Prometheus recoge métricas del gateway y de los tres servicios backend a través de `/metrics`.
- La pila incluye node-exporter como integración de infraestructura.
- Grafana tiene dashboards personalizados para gateway, auth, users y chat.
- Prometheus tiene reglas de alertas evaluadas localmente.
- Grafana está detrás de Nginx, requiere inicio de sesión y ya no expone acceso anónimo público.

## Arquitectura

- `Nginx` es la entrada pública por HTTPS.
- `/api/` va al `gateway`.
- `/grafana/` va a Grafana.
- `/prometheus/` va a Prometheus.
- `Prometheus` recoge las métricas internamente.
- `Grafana` lee los datos desde Prometheus.

## Componentes

### Prometheus

Prometheus recoge métricas de:

- `gateway:3000`
- `auth-service:3003`
- `users-service:3006`
- `chat-service:3009`
- `node-exporter`

También carga las reglas de alertas desde `backend/observability/prometheus/rules.yml`.

### Grafana

Grafana carga automáticamente su datasource y el provisionado de dashboards:

- datasource: Prometheus
- dashboards: gateway, auth, users, chat

Cada dashboard tiene un filtro `Instance` para poder elegir el target sin editar el JSON.

### Node exporter

Node exporter expone métricas de infraestructura para cumplir el requisito de exporters/integraciones sin añadir contenedores innecesarios.

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

- Grafana: `https://q8znls9b-8443.uks1.devtunnels.ms//grafana/`
- Prometheus: `https://q8znls9b-8443.uks1.devtunnels.ms//prometheus/`

## Inicio rápido

```bash
docker compose up -d --build
```

Después abre:

- `https://q8znls9b-8443.uks1.devtunnels.ms//grafana/`
- `https://q8znls9b-8443.uks1.devtunnels.ms//prometheus/`

## Qué comprobar

```bash
docker compose config
docker compose ps
docker compose logs -f prometheus grafana node-exporter
```

Comprueba que Prometheus ve los targets:

```bash
curl -k https://q8znls9b-8443.uks1.devtunnels.ms//prometheus/api/v1/targets | jq '.data.activeTargets[] | {job: .labels.job, instance: .labels.instance, health: .health}'
```

Comprueba que los servicios responden en `/metrics`:

```bash
curl http://localhost:3000/metrics
curl http://localhost:3003/metrics
curl http://localhost:3006/metrics
curl http://localhost:3009/metrics
```

## Por qué esto es suficientemente seguro para el módulo

- Grafana no permite acceso anónimo.
- Grafana requiere usuario y contraseña desde `.env`.
- Grafana se sirve detrás de Nginx con HTTPS.
- Prometheus no está expuesto como puerto público directo.
- Los valores sensibles se guardan en `.env`, que Git ignora.

## Si algo falla

Si un dashboard no muestra datos, revisa:

- que los targets de Prometheus estén en estado `UP`
- que el `Instance` seleccionado coincida con un target realmente scrapeado

## Archivos relacionados

- `backend/gateway/src/observability/metrics/metrics.service.ts`
- `backend/gateway/src/common/interceptors/metrics.interceptor.ts`
- `backend/observability/prometheus/prometheus.yml`
- `backend/observability/prometheus/rules.yml`
- `backend/observability/grafana/datasource.yml`
- `backend/observability/grafana/dashboard.yml`
- `backend/observability/grafana/dashboards/*.json`
