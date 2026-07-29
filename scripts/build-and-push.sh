#!/usr/bin/env bash

set -euo pipefail

ENVIRONMENT="${1:?usage: $0 <environment> [tag]}"
shift

export TF_VAR_environment="$ENVIRONMENT"

source "$(dirname "${BASH_SOURCE[0]}")/_common.sh"

TAG="${1:-$(git rev-parse --short HEAD)}"
SECRET_NAME="${SUPABASE_SECRET_NAME:-genehub/${ENVIRONMENT}/supabase}"
REPO_NAME="genehub-${ENVIRONMENT}-frontend"
FRONTEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../frontend" && pwd)"

preflight

docker info >/dev/null 2>&1 || die "Docker daemon is not running."

REPO_URL="$(aws ecr describe-repositories \
  --repository-names "$REPO_NAME" \
  --region "$REGION" \
  --query 'repositories[0].repositoryUri' \
  --output text 2>/dev/null)" ||
  die "ECR repository ${REPO_NAME} not found. Run scripts/deploy-infra.sh apply first."

log "Repository ${REPO_URL}"
log "Tag ${TAG}"

SECRET_JSON="$(aws secretsmanager get-secret-value \
  --secret-id "$SECRET_NAME" \
  --region "$REGION" \
  --query SecretString \
  --output text)" ||
  die "Secret ${SECRET_NAME} not found. Run scripts/put-supabase-secrets.sh ${ENVIRONMENT} first."

SUPABASE_URL="$(jq -r '.VITE_SUPABASE_URL' <<<"$SECRET_JSON")"
SUPABASE_ANON_KEY="$(jq -r '.VITE_SUPABASE_ANON_KEY' <<<"$SECRET_JSON")"

log "Supabase ${SUPABASE_URL}"
log "docker login"
aws ecr get-login-password --region "$REGION" |
  docker login --username AWS --password-stdin "${REPO_URL%%/*}"

# Fargate runs x86_64 by default. Building natively on Apple Silicon would
# produce an arm64 image that dies with "exec format error" in the task.
log "docker build (linux/amd64)"
docker build \
  --platform linux/amd64 \
  --provenance=false \
  --sbom=false \
  --build-arg "VITE_SUPABASE_URL=${SUPABASE_URL}" \
  --build-arg "VITE_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}" \
  -t "${REPO_URL}:${TAG}" \
  "$FRONTEND_DIR"

log "docker push"
docker push "${REPO_URL}:${TAG}"

DIGEST="$(aws ecr describe-images \
  --repository-name "$REPO_NAME" \
  --image-ids "imageTag=${TAG}" \
  --region "$REGION" \
  --query 'imageDetails[0].imageDigest' \
  --output text)"

echo
log "Pushed ${REPO_URL}:${TAG}"
log "Digest ${DIGEST}"
