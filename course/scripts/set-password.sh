#!/bin/sh
# Asks for a course passphrase without showing it and saves it to course/.env (gitignored).
# Usage: sh scripts/set-password.sh [VARIABLE_NAME]   (default COURSE_PASSWORD_NLP_BASIC)
set -e
cd "$(dirname "$0")/.."
VAR="${1:-COURSE_PASSWORD_NLP_BASIC}"
printf 'Passphrase for %s (not shown): ' "$VAR"
stty -echo
IFS= read -r PW || true
stty echo
echo
if [ ${#PW} -lt 12 ]; then
  echo "Too short (${#PW} characters). Use at least 12, ideally 4-5 random words. Nothing saved."
  exit 1
fi
touch .env
chmod 600 .env
# keep other lines, replace this variable's line
grep -v "^$VAR=" .env > .env.tmp || true
printf '%s=%s\n' "$VAR" "$PW" >> .env.tmp
mv .env.tmp .env
chmod 600 .env
unset PW
echo "saved to $(pwd)/.env"
