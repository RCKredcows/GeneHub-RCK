#!/usr/bin/env bash

set -euo pipefail

ENVIRONMENT="${1:?usage: $0 <environment> [--show]}"
shift

export TF_VAR_environment="$ENVIRONMENT"

source "$(dirname "${BASH_SOURCE[0]}")/_common.sh"

SECRET_NAME="${SUPABASE_SECRET_NAME:-genehub/${ENVIRONMENT}/supabase}"

preflight

if [[ "${1:-}" == "--show" ]]; then
  aws secretsmanager get-secret-value \
    --secret-id "$SECRET_NAME" \
    --region "$REGION" \
    --query SecretString \
    --output text
  exit 0
fi

SUPABASE_URL="${VITE_SUPABASE_URL:-}"
SUPABASE_ANON_KEY="${VITE_SUPABASE_ANON_KEY:-}"

[[ -n "$SUPABASE_URL" ]]      || read -r -p "VITE_SUPABASE_URL: " SUPABASE_URL
[[ -n "$SUPABASE_ANON_KEY" ]] || read -r -p "VITE_SUPABASE_ANON_KEY: " SUPABASE_ANON_KEY

PAYLOAD="$(printf '{"VITE_SUPABASE_URL":"%s","VITE_SUPABASE_ANON_KEY":"%s"}' \
  "$SUPABASE_URL" "$SUPABASE_ANON_KEY")"

if aws secretsmanager describe-secret --secret-id "$SECRET_NAME" --region "$REGION" >/dev/null 2>&1; then
  log "Updating ${SECRET_NAME}"
  aws secretsmanager put-secret-value \
    --secret-id "$SECRET_NAME" \
    --secret-string "$PAYLOAD" \
    --region "$REGION" >/dev/null
else
  log "Creating ${SECRET_NAME}"
  aws secretsmanager create-secret \
    --name "$SECRET_NAME" \
    --secret-string "$PAYLOAD" \
    --region "$REGION" \
    --tags "Key=Project,Value=genehub" "Key=Environment,Value=${ENVIRONMENT}" >/dev/null
fi

log "Done."
