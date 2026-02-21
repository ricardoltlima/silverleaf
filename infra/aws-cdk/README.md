# Silverleaf AWS CDK (TypeScript)

## Prerequisites
- Node.js 20+
- AWS CLI configured
- CDK bootstrap per account/region:
  - `cd infra/aws-cdk`
  - `npm install`
  - `npx cdk bootstrap aws://<ACCOUNT>/<REGION>`

## Environments
- `dev`
- `qa`
- `prod`

Choose stage via context:
- `npx cdk synth -c stage=dev`
- `npx cdk deploy -c stage=qa -c imageTag=<TAG>`
- `npx cdk deploy -c stage=prod -c imageTag=<TAG>`

## What this stack creates
- VPC with public/private/isolated subnets
- ECS Fargate service + ALB
- RDS PostgreSQL
- ElastiCache Redis
- S3 uploads bucket
- SQS queue for async jobs
- CloudWatch alarms (sample)

## Notes
- Defaults are intentionally conservative for cost in `dev/qa`.
- Replace placeholder account values in `lib/environment-config.ts`.
- This stack expects an existing ECR repository named `silverleaf-api-<stage>`.
- Deploy with an explicit image tag so ECS rolls out new revisions:
  - `npx cdk deploy SilverleafPlatform-dev -c stage=dev -c imageTag=<GIT_SHA>`
