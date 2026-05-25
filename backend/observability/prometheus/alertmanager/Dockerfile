FROM alpine:3.20

ARG ALERTMANAGER_VERSION=v0.31.0

RUN apk add --no-cache ca-certificates gettext tar wget && \
		wget -qO- "https://github.com/prometheus/alertmanager/releases/download/${ALERTMANAGER_VERSION}/alertmanager-${ALERTMANAGER_VERSION#v}.linux-amd64.tar.gz" \
			| tar xz -C /tmp && \
		install -m 0755 "/tmp/alertmanager-${ALERTMANAGER_VERSION#v}.linux-amd64/alertmanager" /bin/alertmanager && \
		install -m 0755 "/tmp/alertmanager-${ALERTMANAGER_VERSION#v}.linux-amd64/amtool" /bin/amtool && \
		rm -rf "/tmp/alertmanager-${ALERTMANAGER_VERSION#v}.linux-amd64"

COPY alertmanager/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]