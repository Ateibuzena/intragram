# Metrics and Observability

## Quick start

```bash
docker compose up -d --build
```

Useful entry points behind Nginx:

- `https://localhost:8443/grafana/`
- `https://localhost:8443/prometheus/`
- `https://localhost:8443/alertmanager/`

## What to check

```bash
docker compose config
docker compose ps
docker compose logs -f prometheus alertmanager grafana
```

Prometheus targets should be healthy:

```bash
curl -k https://localhost:8443/prometheus/api/v1/targets | jq '.data.activeTargets[] | {job: .labels.job, instance: .labels.instance, health: .health}'
```

Per-service metrics endpoints should answer:

```bash
curl http://localhost:3000/metrics
curl http://localhost:3003/metrics
curl http://localhost:3006/metrics
curl http://localhost:3009/metrics
```

Grafana dashboards are provisioned automatically from:

- `gateway-observability`
- `auth-service-observability`
- `users-service-observability`
- `chat-service-observability`

## Test alert flow

You can send a synthetic alert directly to Alertmanager to verify email delivery:

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
      "summary": "Synthetic alert for delivery verification"
    },
    "startsAt": "2026-05-25T00:00:00Z"
  }]'
```

Then verify the alert in:

```bash
curl -k https://localhost:8443/alertmanager/api/v2/alerts | jq
```

## Instance filters in dashboards

Each dashboard exposes an `Instance` variable so you can switch between service instances without editing queries. If a dashboard shows no data, confirm the selected instance matches the scraped target name in Prometheus.

## Notes

- `prometheus` and `alertmanager` are intentionally not exposed on public ports; use the Nginx routes.
- If email delivery fails, check the `ALERTMANAGER_*` values in `.env` and the SMTP server reachability.