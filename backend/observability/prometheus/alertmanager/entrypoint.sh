#!/bin/sh
set -eu

required_vars="ALERTMANAGER_EMAIL_TO ALERTMANAGER_EMAIL_FROM ALERTMANAGER_SMARTHOST ALERTMANAGER_EMAIL_USERNAME ALERTMANAGER_EMAIL_PASSWORD"
missing_vars=""

for var_name in $required_vars; do
	eval "var_value=\${$var_name:-}"
	if [ -z "$var_value" ]; then
		missing_vars="$missing_vars $var_name"
	fi
done

if [ -n "$missing_vars" ]; then
	cat > /etc/alertmanager/alertmanager.yml <<'EOF'
global:
  resolve_timeout: 5m

route:
  receiver: 'null'

receivers:
  - name: 'null'
EOF
else
	envsubst < /etc/alertmanager/alertmanager.yml.template > /etc/alertmanager/alertmanager.yml
fi

exec /bin/alertmanager "$@"