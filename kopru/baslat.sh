#!/usr/bin/env bash
cd "$(dirname "$0")"
command -v node >/dev/null || { echo "Node.js kurulu değil: https://nodejs.org"; exit 1; }
[ -d node_modules ] || npm install
KULLANICI="$1"
[ -z "$KULLANICI" ] && read -rp "TikTok kullanıcı adınız (@ olmadan): " KULLANICI
node sunucu.js "$KULLANICI"
