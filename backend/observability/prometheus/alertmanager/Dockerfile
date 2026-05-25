FROM prom/alertmanager:v0.31.0

USER root
RUN apk add --no-cache gettext

COPY alertmanager/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

USER nobody
ENTRYPOINT ["/entrypoint.sh"]