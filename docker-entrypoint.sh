#!/bin/sh
set -eu

URL=$(printf '%s' "${VITE_API_BASE_URL-}" | sed 's/\\/\\\\/g; s/"/\\"/g')

cat > /usr/share/nginx/html/config.js <<EOF
window.__APP_CONFIG__ = { apiBaseUrl: "$URL" };
EOF

exec nginx -g 'daemon off;'
