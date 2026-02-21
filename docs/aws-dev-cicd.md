# AWS Dev CI/CD (Low-Cost, Step by Step)

## Goal
- Push code to GitHub.
- On every push to `dev`, GitHub Actions:
  - runs tests,
  - builds Docker image,
  - pushes image to ECR,
  - deploys `SilverleafPlatform-dev` with CDK.

## Current workflow
- File: `.github/workflows/deploy-dev.yml`
- Trigger: `push` on branch `dev` (and manual `workflow_dispatch`).
- AWS region default: `us-east-1`.
- ECR repository default: `silverleaf-api-dev`.

## One-time AWS setup
1. Create an IAM role for GitHub OIDC (example name: `GitHubActionsSilverleafDevDeployRole`).
2. Add GitHub OIDC provider in IAM if it does not exist:
   - Provider URL: `https://token.actions.githubusercontent.com`
   - Audience: `sts.amazonaws.com`
3. Set role trust policy (replace `<ORG>`, `<REPO>`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::<AWS_ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:<ORG>/<REPO>:*"
        }
      }
    }
  ]
}
```

4. Attach permissions to the role:
   - For fastest setup now: `AdministratorAccess` on a dedicated dev AWS account.
   - Tighten later to least-privilege once the resource list stabilizes.

## One-time GitHub setup
1. In GitHub repo settings, create secret:
   - `AWS_ROLE_TO_ASSUME`: full ARN of the IAM role above.
2. Create/push branch `dev` if it does not exist.

## First deploy
1. Push to `dev`.
2. Watch GitHub Actions workflow `Deploy Dev`.
3. After success, in AWS CloudFormation, open stack `SilverleafPlatform-dev`.
4. Copy output `ApiUrl` and test endpoint health/login.

## Cost controls for dev
- Keep `dev` only (no `qa`/`prod` yet).
- Keep ECS desired count at 1 (already configured).
- `natGateways` is `0` in `dev` to reduce fixed monthly cost.
- Use single-AZ, no multi-AZ DB in `dev` (already configured).
- Shut down/destroy dev stack when not needed:
  - `npx cdk destroy SilverleafPlatform-dev -c stage=dev`

## What CI/CD is doing right now
- Quality gate: `./gradlew clean test bootJar`
- Delivery:
  - builds image from `Dockerfile`,
  - pushes `<commit-sha>` and `latest` tags,
  - deploys CDK with `imageTag=<commit-sha>` so ECS performs a real rollout.
