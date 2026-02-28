FROM grafana/grafana:10.2.0

# Copiar configuración de datasources y dashboards
COPY datasource.yml /etc/grafana/provisioning/datasources/
COPY dashboard.yml /etc/grafana/provisioning/dashboards/
COPY dashboards/ /var/lib/grafana/dashboards/

# Permisos
USER root
RUN chown -R 472:472 /etc/grafana /var/lib/grafana
USER 472
