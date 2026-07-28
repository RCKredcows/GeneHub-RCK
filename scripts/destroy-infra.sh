#!/usr/bin/env bash
#
# Tear down the Terraform-managed infrastructure.


set -euo pipefail

source "$(dirname "${BASH_SOURCE[0]}")/_common.sh"

ACTION="${1:-plan}"

case "$ACTION" in
  plan|destroy) ;;
  *) die "Unknown action '$ACTION'. Use 'plan' to preview or 'destroy' to tear down." ;;
esac

preflight
setup_var_file

if ! backend_exists; then
  die "State backend not found (bucket '${BUCKET}' and/or table '${LOCK_TABLE}' missing in ${REGION}). Nothing to destroy — run deploy-infra.sh first, or check AWS_REGION and TF_STATE_BUCKET."
fi

tf_init

if [[ "$ACTION" == "plan" ]]; then
  log "terraform plan -destroy (preview only, nothing will be removed)"
  terraform plan -destroy ${VAR_ARGS[@]+"${VAR_ARGS[@]}"}
  echo
  log "Preview only. Re-run as 'scripts/destroy-infra.sh destroy' to actually tear down."
  exit 0
fi

echo
warn "About to DESTROY infrastructure:"
warn "  account:     ${ACCOUNT_ID}"
warn "  region:      ${REGION}"
warn "  environment: ${TF_VAR_environment}"
warn "  state:       s3://${BUCKET}/${STATE_KEY}"
echo

read -r -p "Type the environment name ('${TF_VAR_environment}') to confirm: " CONFIRM
if [[ "$CONFIRM" != "$TF_VAR_environment" ]]; then
  die "Confirmation did not match. Aborted; nothing was destroyed."
fi

log "terraform destroy"
# Terraform prompts again with the full plan before removing anything.
terraform destroy ${VAR_ARGS[@]+"${VAR_ARGS[@]}"}
