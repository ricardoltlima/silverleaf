#!/usr/bin/env node
import { App } from "aws-cdk-lib";
import { STAGE_CONFIGS, Stage } from "../lib/environment-config";
import { SilverleafPlatformStack } from "../lib/silverleaf-platform-stack";

const app = new App();

const stage = (app.node.tryGetContext("stage") ?? process.env.STAGE ?? "dev") as Stage;
const imageTag = (app.node.tryGetContext("imageTag") ?? process.env.IMAGE_TAG ?? "latest") as string;
const config = STAGE_CONFIGS[stage];
if (!config) {
  throw new Error(`Unknown stage '${stage}'. Use one of: dev, qa, prod`);
}

new SilverleafPlatformStack(app, `SilverleafPlatform-${config.stage}`, {
  env: {
    account: config.account,
    region: config.region
  },
  config,
  imageTag
});
