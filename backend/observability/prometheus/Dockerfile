
FROM prom/prometheus:v2.44.0

COPY prometheus.yml /etc/prometheus/prometheus.yml

USER root
RUN chown -R 65534:65534 /etc/prometheus/prometheus.yml || true
USER 65534