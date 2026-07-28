#!/usr/bin/env bash
#
# Bootstrap the Terraform remote-state backend, then plan or apply.
#
# Creates the S3 state bucket and DynamoDB lock table if they don't exist,
# then initializes Terraform against them and runs the requested action.
#
# Usage:
#   scripts/deploy-infra.sh plan
#   scripts/deploy-infra.sh apply
#   scripts/deploy-infra.sh init
#   scripts/deploy-infra.sh output


set -euo pipefail

source "$(dirname "${BASH_SOURCE[0]}")/_common.sh"

ACTION="${1:-plan}"

case "$ACTION" in
  plan|apply|init|output) ;;
  destroy) die "Use scripts/destroy-infra.sh instead." ;;
  *) die "Unknown action '$ACTION'. Use one of: plan, apply, init, output" ;;
esac

preflight
setup_var_file
ensure_backend
tf_init

if [[ "$ACTION" == "init" ]]; then
  log "Init complete."
  exit 0
fi

if [[ "$ACTION" == "output" ]]; then
  terraform output
  exit 0
fi

log "terraform fmt -check"
terraform fmt -check -recursive || warn "Formatting issues above (not fatal). Run 'terraform fmt -recursive' to fix."

log "terraform validate"
terraform validate

log "terraform ${ACTION}"
# No -auto-approve: apply still prompts for confirmation.
terraform "$ACTION" ${VAR_ARGS[@]+"${VAR_ARGS[@]}"}
