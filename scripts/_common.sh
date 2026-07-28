#!/usr/bin/env bash
#
# Shared helpers for deploy-infra.sh and destroy-infra.sh.
# Overridable via environment:
#   TF_STATE_BUCKET    (default: genehub-infra)
#   TF_LOCK_TABLE      (default: terraform-locks)
#   TF_STATE_KEY       (default: networking/terraform.tfstate)
#   AWS_REGION         (default: us-east-1)
#   TF_VAR_environment (default: dev)

BUCKET="${TF_STATE_BUCKET:-genehub-infra}"
LOCK_TABLE="${TF_LOCK_TABLE:-terraform-locks}"
STATE_KEY="${TF_STATE_KEY:-networking/terraform.tfstate}"
REGION="${AWS_REGION:-${AWS_DEFAULT_REGION:-us-east-1}}"

TERRAFORM_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../infra/terraform" && pwd)"

export TF_VAR_environment="${TF_VAR_environment:-dev}"
export AWS_REGION="$REGION"

TFVARS_FILE="${TFVARS_FILE:-${TERRAFORM_DIR}/${TF_VAR_environment}.tfvars}"

log()  { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m!!\033[0m %s\n' "$*" >&2; }
die()  { printf '\033[1;31mxx\033[0m %s\n' "$*" >&2; exit 1; }

# Verify tooling and credentials are present and usable.
preflight() {
  command -v aws       >/dev/null || die "aws CLI not found on PATH"
  command -v terraform >/dev/null || die "terraform not found on PATH"

  # Let STS be the judge rather than checking for specific env vars: a default
  # profile in ~/.aws/credentials, SSO, and instance roles all work without any
  # of them being set.
  log "Verifying credentials..."
  local caller
  if ! caller="$(aws sts get-caller-identity --output text --query '[Account,Arn]' 2>&1)"; then
    die "No usable AWS credentials. Set AWS_PROFILE, or AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY, or configure a default profile. AWS said: ${caller}"
  fi
  ACCOUNT_ID="$(cut -f1 <<<"$caller")"
  CALLER_ARN="$(cut -f2 <<<"$caller")"

  log "Account ${ACCOUNT_ID} as ${CALLER_ARN}"
  log "Region ${REGION}, environment ${TF_VAR_environment}"
}

backend_exists() {
  aws s3api head-bucket --bucket "$BUCKET" >/dev/null 2>&1 &&
    aws dynamodb describe-table --table-name "$LOCK_TABLE" --region "$REGION" >/dev/null 2>&1
}

# Create the state bucket and lock table if they are missing, then bring the
# bucket's settings up to spec. Every call here is idempotent.
ensure_backend() {
  if aws s3api head-bucket --bucket "$BUCKET" >/dev/null 2>&1; then
    log "State bucket s3://${BUCKET} already exists"
  else
    log "Creating state bucket s3://${BUCKET}"
    local create_err
    # us-east-1 is the one region that rejects an explicit LocationConstraint.
    if [[ "$REGION" == "us-east-1" ]]; then
      create_err="$(aws s3api create-bucket --bucket "$BUCKET" --region "$REGION" 2>&1 >/dev/null)" ||
        _handle_bucket_error "$create_err"
    else
      create_err="$(aws s3api create-bucket --bucket "$BUCKET" --region "$REGION" \
        --create-bucket-configuration "LocationConstraint=${REGION}" 2>&1 >/dev/null)" ||
        _handle_bucket_error "$create_err"
    fi
    aws s3api wait bucket-exists --bucket "$BUCKET"
  fi

  # Re-applied on every run so an existing bucket gets brought up to spec
  # rather than silently staying wrong.
  log "Enforcing versioning, encryption, and public access block on s3://${BUCKET}"

  aws s3api put-bucket-versioning \
    --bucket "$BUCKET" \
    --versioning-configuration Status=Enabled

  aws s3api put-bucket-encryption \
    --bucket "$BUCKET" \
    --server-side-encryption-configuration \
      '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"},"BucketKeyEnabled":true}]}'

  aws s3api put-public-access-block \
    --bucket "$BUCKET" \
    --public-access-block-configuration \
      "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

  if aws dynamodb describe-table --table-name "$LOCK_TABLE" --region "$REGION" >/dev/null 2>&1; then
    log "Lock table ${LOCK_TABLE} already exists"
  else
    log "Creating DynamoDB lock table ${LOCK_TABLE}"
    # LockID as the hash key is required by Terraform's S3 backend.
    aws dynamodb create-table \
      --table-name "$LOCK_TABLE" \
      --attribute-definitions AttributeName=LockID,AttributeType=S \
      --key-schema AttributeName=LockID,KeyType=HASH \
      --billing-mode PAY_PER_REQUEST \
      --region "$REGION" >/dev/null
    log "Waiting for ${LOCK_TABLE} to become active..."
    aws dynamodb wait table-exists --table-name "$LOCK_TABLE" --region "$REGION"
  fi
}

_handle_bucket_error() {
  if grep -q 'BucketAlreadyExists' <<<"$1"; then
    die "Bucket name '${BUCKET}' is taken by another AWS account (S3 names are globally unique). Set TF_STATE_BUCKET to something else."
  fi
  die "Failed to create bucket: $1"
}

# Populates VAR_ARGS with -var-file if the environment's tfvars exists.
# Referenced as "${VAR_ARGS[@]+"${VAR_ARGS[@]}"}" so an empty array is safe
# under `set -u` on the bash 3.2 that ships with macOS.
setup_var_file() {
  VAR_ARGS=()

  if [[ -f "$TFVARS_FILE" ]]; then
    VAR_ARGS=(-var-file="$TFVARS_FILE")
    log "Variables from $(basename "$TFVARS_FILE")"
  else
    warn "No ${TFVARS_FILE##*/} found. Copy ${TF_VAR_environment}.tfvars.example and fill it in, or Terraform will prompt for every required variable."
  fi
}

tf_init() {
  cd "$TERRAFORM_DIR"

  log "terraform init"
  terraform init -reconfigure -input=false \
    -backend-config="bucket=${BUCKET}" \
    -backend-config="key=${STATE_KEY}" \
    -backend-config="region=${REGION}" \
    -backend-config="dynamodb_table=${LOCK_TABLE}" \
    -backend-config="encrypt=true"
}
