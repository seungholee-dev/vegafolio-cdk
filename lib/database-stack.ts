import * as rds from "aws-cdk-lib/aws-rds";
import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { Duration } from "aws-cdk-lib";

export interface DatabaseStackProps extends cdk.StackProps {
    vpc: ec2.Vpc;
}

export class DatabaseStack extends cdk.Stack {
    private vpc: ec2.Vpc;
    private ec2Instance: ec2.Instance;

    constructor(scope, id, props: DatabaseStackProps) {
        super(scope, id, props);

        // Shared VPC
        const vpc = props.vpc;

        // DB Security Group
        const dbSG = new ec2.SecurityGroup(this, "DBSecurityGroup", {
            vpc,
        });

        // RDS
        const instance = new rds.DatabaseInstance(
            this,
            "vegafolio-db-instance",
            {
                vpc,
                vpcSubnets: {
                    subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
                },
                engine: rds.DatabaseInstanceEngine.mysql({
                    version: rds.MysqlEngineVersion.VER_8_0_28,
                }),
                instanceType: ec2.InstanceType.of(
                    ec2.InstanceClass.BURSTABLE2,
                    ec2.InstanceSize.MICRO
                ),
                instanceIdentifier: "vegafolio-db-instance",
                databaseName: "vegafoliodb",
                credentials: rds.Credentials.fromGeneratedSecret("mysqlSecret"),
                securityGroups: [dbSG],
            }
        );

        // Lambda Security Group
        const lambdaSG = new ec2.SecurityGroup(this, "LambdaSG", {
            vpc,
        });

        // DB Security Group Ingress Rules
        dbSG.addIngressRule(
            lambdaSG,
            ec2.Port.tcp(3306), // MySQL port
            "Lambda to MySQL DB"
        );

        // RDS PROXY
        const dbProxy = new rds.DatabaseProxy(this, "VegafolioRDSProxy", {
            proxyTarget: rds.ProxyTarget.fromInstance(instance),
            secrets: [instance.secret!],
            securityGroups: [dbSG],
            vpc,
            requireTLS: false,
            vpcSubnets: vpc.selectSubnets({
                subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
            }),
        });

        // Lambda Function Info
        const rdsLambdaFunction = new NodejsFunction(this, "rdsLambdaFN", {
            entry: "./src/lambda_functions/rds-init.ts",
            runtime: Runtime.NODEJS_16_X,
            timeout: Duration.minutes(3), // Preventing coldstart time
            functionName: "handler",
            environment: {
                DB_ENDPOINT_ADDRESS: dbProxy.endpoint,
                DB_NAME: "vegafoliodb",
                DB_SECRET_ARN: instance.secret?.secretFullArn || "", // Not Fetching Password directly but via SecretARN for security :)
            },
            vpc,
            vpcSubnets: vpc.selectSubnets({
                subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
            }),
            bundling: {
                externalModules: [
                    "aws-sdk", // No Need to include AWS SDK as we are using native aws-sdk.
                ],
            },
            securityGroups: [lambdaSG],
        });

        instance.secret?.grantRead(rdsLambdaFunction);
    }
}
