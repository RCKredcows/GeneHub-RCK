resource "aws_ecr_repository" "frontend" {
  # Images are rebuilt by scripts/build-and-push.sh from source, so a
  # repository full of them is not worth blocking a teardown over. Without
  # this, `terraform destroy` fails on RepositoryNotEmptyException and has to
  # be cleared by hand.
  force_delete = true

  name = "${local.name_prefix}-frontend"

  # Immutable tags mean a given tag always refers to the same image, so a
  # rollback to a known tag is actually a rollback. Deploys reference digests.
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Name = "${local.name_prefix}-frontend"
  }
}

# Untagged layers accumulate on every rebuild; tagged images are capped so the
# repository does not grow without bound.
resource "aws_ecr_lifecycle_policy" "frontend" {
  repository = aws_ecr_repository.frontend.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Expire untagged images after 7 days"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 7
        }
        action = { type = "expire" }
      },
      {
        rulePriority = 2
        description  = "Keep the 30 most recent tagged images"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["v", "sha"]
          countType     = "imageCountMoreThan"
          countNumber   = 30
        }
        action = { type = "expire" }
      },
    ]
  })
}
