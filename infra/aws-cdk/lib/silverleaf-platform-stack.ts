import {
  CfnOutput,
  Duration,
  RemovalPolicy,
  Stack,
  StackProps
} from "aws-cdk-lib";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecsPatterns from "aws-cdk-lib/aws-ecs-patterns";
import * as elasticache from "aws-cdk-lib/aws-elasticache";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as logs from "aws-cdk-lib/aws-logs";
import * as rds from "aws-cdk-lib/aws-rds";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";
import { StageConfig } from "./environment-config";

export interface SilverleafPlatformStackProps extends StackProps {
  readonly config: StageConfig;
  readonly imageTag: string;
}

export class SilverleafPlatformStack extends Stack {
  constructor(scope: Construct, id: string, props: SilverleafPlatformStackProps) {
    super(scope, id, props);

    const { config } = props;
    const repositoryName = `silverleaf-api-${config.stage}`;
    const repositoryUri = `${Stack.of(this).account}.dkr.ecr.${Stack.of(this).region}.amazonaws.com/${repositoryName}`;

    const vpc = new ec2.Vpc(this, "Vpc", {
      maxAzs: 2,
      natGateways: config.natGateways,
      subnetConfiguration: [
        { name: "public", subnetType: ec2.SubnetType.PUBLIC, cidrMask: 24 },
        { name: "private", subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS, cidrMask: 24 },
        { name: "isolated", subnetType: ec2.SubnetType.PRIVATE_ISOLATED, cidrMask: 24 }
      ]
    });

    const uploadsBucket = new s3.Bucket(this, "UploadsBucket", {
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: false,
      lifecycleRules: [{ expiration: Duration.days(180) }],
      removalPolicy: config.stage === "prod" ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
      autoDeleteObjects: config.stage !== "prod"
    });

    const eventsQueue = new sqs.Queue(this, "EventsQueue", {
      visibilityTimeout: Duration.seconds(60),
      retentionPeriod: Duration.days(4)
    });

    const dbSecret = new rds.DatabaseSecret(this, "DbSecret", {
      username: "silverleaf"
    });

    const db = new rds.DatabaseInstance(this, "Database", {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16_4
      }),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      credentials: rds.Credentials.fromSecret(dbSecret),
      databaseName: "silverleaf",
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      instanceType: config.stage === "prod"
        ? ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MEDIUM)
        : ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MICRO),
      multiAz: config.dbMultiAz,
      backupRetention: Duration.days(config.stage === "prod" ? 7 : 1),
      deletionProtection: config.stage === "prod",
      publiclyAccessible: false,
      removalPolicy: config.stage === "prod" ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY
    });

    const redisSubnetGroup = new elasticache.CfnSubnetGroup(this, "RedisSubnetGroup", {
      cacheSubnetGroupName: `silverleaf-${config.stage}-redis-subnets`,
      description: "Redis subnet group",
      subnetIds: vpc.isolatedSubnets.map(s => s.subnetId)
    });

    const redisSecurityGroup = new ec2.SecurityGroup(this, "RedisSecurityGroup", {
      vpc,
      allowAllOutbound: true
    });

    const redisCluster = new elasticache.CfnCacheCluster(this, "Redis", {
      engine: "redis",
      cacheNodeType: config.stage === "prod" ? "cache.t4g.small" : "cache.t4g.micro",
      numCacheNodes: 1,
      clusterName: `silverleaf-${config.stage}-redis`,
      vpcSecurityGroupIds: [redisSecurityGroup.securityGroupId],
      cacheSubnetGroupName: redisSubnetGroup.ref
    });
    redisCluster.addDependency(redisSubnetGroup);

    const cluster = new ecs.Cluster(this, "Cluster", { vpc });

    const taskDefinition = new ecs.FargateTaskDefinition(this, "ApiTaskDefinition", {
      cpu: config.stage === "prod" ? 1024 : 512,
      memoryLimitMiB: config.stage === "prod" ? 2048 : 1024
    });

    const logGroup = new logs.LogGroup(this, "ApiLogGroup", {
      retention: config.stage === "prod" ? logs.RetentionDays.ONE_MONTH : logs.RetentionDays.ONE_WEEK,
      removalPolicy: config.stage === "prod" ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY
    });

    const container = taskDefinition.addContainer("ApiContainer", {
      image: ecs.ContainerImage.fromRegistry(`${repositoryUri}:${props.imageTag}`),
      logging: ecs.LogDriver.awsLogs({
        streamPrefix: `silverleaf-${config.stage}`,
        logGroup
      }),
      environment: {
        SPRING_PROFILES_ACTIVE: config.stage,
        DB_URL: `jdbc:postgresql://${db.dbInstanceEndpointAddress}:${db.dbInstanceEndpointPort}/silverleaf`,
        DB_USERNAME: "silverleaf",
        FEED_UPLOAD_DIR: "/tmp/uploads",
        REDIS_HOST: redisCluster.attrRedisEndpointAddress,
        REDIS_PORT: redisCluster.attrRedisEndpointPort,
        EVENTS_QUEUE_URL: eventsQueue.queueUrl
      },
      secrets: {
        DB_PASSWORD: ecs.Secret.fromSecretsManager(dbSecret, "password"),
        JWT_SECRET: ecs.Secret.fromSecretsManager(
          new secretsmanager.Secret(this, "JwtSecret", {
            secretName: `silverleaf/${config.stage}/jwt`,
            generateSecretString: {
              passwordLength: 64,
              excludePunctuation: true
            }
          })
        )
      }
    });
    container.addPortMappings({ containerPort: 8080 });

    uploadsBucket.grantReadWrite(taskDefinition.taskRole);
    eventsQueue.grantSendMessages(taskDefinition.taskRole);

    const service = new ecsPatterns.ApplicationLoadBalancedFargateService(this, "ApiService", {
      cluster,
      taskDefinition,
      publicLoadBalancer: true,
      desiredCount: config.desiredTasks,
      listenerPort: 80,
      taskSubnets: config.stage === "dev"
        ? { subnetType: ec2.SubnetType.PUBLIC }
        : { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }
    });

    db.connections.allowFrom(service.service, ec2.Port.tcp(5432));
    redisSecurityGroup.addIngressRule(service.service.connections.securityGroups[0], ec2.Port.tcp(6379));

    const scalableTarget = service.service.autoScaleTaskCount({
      minCapacity: config.minTasks,
      maxCapacity: config.maxTasks
    });
    scalableTarget.scaleOnCpuUtilization("CpuScaling", {
      targetUtilizationPercent: 60
    });
    scalableTarget.scaleOnMemoryUtilization("MemoryScaling", {
      targetUtilizationPercent: 70
    });

    new cloudwatch.Alarm(this, "Alb5xxAlarm", {
      metric: service.loadBalancer.metricHttpCodeElb(elbv2.HttpCodeElb.ELB_5XX_COUNT, {
        period: Duration.minutes(1)
      }),
      threshold: 10,
      evaluationPeriods: 3
    });

    new cloudwatch.Alarm(this, "ApiCpuAlarm", {
      metric: service.service.metricCpuUtilization({ period: Duration.minutes(1) }),
      threshold: 85,
      evaluationPeriods: 5
    });

    new CfnOutput(this, "ApiUrl", { value: `http://${service.loadBalancer.loadBalancerDnsName}` });
    new CfnOutput(this, "EcrRepositoryName", { value: repositoryName });
    new CfnOutput(this, "EcrRepositoryUri", { value: repositoryUri });
    new CfnOutput(this, "UploadsBucketName", { value: uploadsBucket.bucketName });
    new CfnOutput(this, "DatabaseEndpoint", { value: db.dbInstanceEndpointAddress });
    new CfnOutput(this, "EventsQueueUrl", { value: eventsQueue.queueUrl });
  }
}
