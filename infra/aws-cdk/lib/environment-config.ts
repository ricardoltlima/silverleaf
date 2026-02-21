export type Stage = "dev" | "qa" | "prod";

export interface StageConfig {
  readonly stage: Stage;
  readonly account: string;
  readonly region: string;
  readonly minTasks: number;
  readonly maxTasks: number;
  readonly desiredTasks: number;
  readonly dbMultiAz: boolean;
  readonly natGateways: number;
}

export const STAGE_CONFIGS: Record<Stage, StageConfig> = {
  dev: {
    stage: "dev",
    account: process.env.CDK_DEFAULT_ACCOUNT ?? "111111111111",
    region: process.env.CDK_DEFAULT_REGION ?? "us-east-1",
    minTasks: 1,
    maxTasks: 2,
    desiredTasks: 1,
    dbMultiAz: false,
    natGateways: 0
  },
  qa: {
    stage: "qa",
    account: process.env.CDK_DEFAULT_ACCOUNT ?? "111111111111",
    region: process.env.CDK_DEFAULT_REGION ?? "us-east-1",
    minTasks: 1,
    maxTasks: 3,
    desiredTasks: 1,
    dbMultiAz: false,
    natGateways: 1
  },
  prod: {
    stage: "prod",
    account: process.env.CDK_DEFAULT_ACCOUNT ?? "111111111111",
    region: process.env.CDK_DEFAULT_REGION ?? "us-east-1",
    minTasks: 2,
    maxTasks: 12,
    desiredTasks: 2,
    dbMultiAz: true,
    natGateways: 2
  }
};
