import * as rds from "aws-cdk-lib/aws-rds";
import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from "aws-cdk-lib/aws-iam";

import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { Duration } from "aws-cdk-lib";
import {
    AwsCustomResource,
    PhysicalResourceId,
    AwsCustomResourcePolicy,
} from "aws-cdk-lib/custom-resources";

export interface DatabaseStackProps extends cdk.StackProps {
    vpc: ec2.Vpc;
}

export class DatabaseStack extends cdk.Stack {
    private vpc: ec2.Vpc;
    private ec2Instance: ec2.Instance;

    constructor(scope, id, props: DatabaseStackProps) {
        super(scope, id, props);

        // Get Shared VPC
        const vpc = props.vpc;

        // Create DB Security Group
        const dbSG = new ec2.SecurityGroup(this, "DBSecurityGroup", {
            vpc,
        });

        // Import Security Group for Jump Box (EC2 Instance)
        const webserverSGID = cdk.Fn.importValue("webserverSGOutput");

        const jumpBoxSG = ec2.SecurityGroup.fromSecurityGroupId(
            this,
            "JumpBoxSG",
            webserverSGID
        );

        // Create RDS Instance
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

        // Add Ingress Rules to DB Security Group (Who is allowed to access this instance)
        dbSG.addIngressRule(
            jumpBoxSG,
            ec2.Port.tcp(3306), // MySQL port
            "Jump Box to MySQL DB"
        );

        // Creating RDS PROXY for reusing the connection pools. (Requires NAT Gateway attached private subnet)
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

        // Create Lambda Function to initialize the DB with tables and data.
        const rdsLambdaFunction = new NodejsFunction(this, "rdsLambdaFN", {
            entry: "./src/lambda_functions/rds-init.ts",
            runtime: Runtime.NODEJS_16_X,
            timeout: Duration.minutes(3), // Preventing coldstart time
            functionName: "rds-init-function",
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
                // Use Command Hooks to include table-creation.sql file in the bundle
                commandHooks: {
                    beforeBundling(inputDir: string, outputDir: string) {
                        return [
                            `cp ${inputDir}/src/lambda_functions/table-creation.sql ${outputDir}`,
                        ];
                    },

                    afterBundling(inputDir: string, outputDir: string) {
                        return [];
                    },

                    beforeInstall(inputDir: string, outputDir: string) {
                        return [];
                    },
                },

                externalModules: [
                    "aws-sdk", // No Need to include AWS SDK as we are using native aws-sdk.
                ],
            },
            securityGroups: [dbSG],
        });

        // Granting Lambda Function to access RDS Instance
        instance.grantConnect(rdsLambdaFunction);
        // Granting Lambda Function to access RDS Secret
        instance.secret?.grantRead(rdsLambdaFunction);

        // Creating Custom Resource Role for Lambda Function
        let customResourcerole = new iam.Role(
            this,
            "rdsInitCustomResourceRole",
            {
                assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
            }
        );

        // Adding Policy to Custom Resource Role
        customResourcerole.addToPolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ["lambda:InvokeFunction"],
                resources: [rdsLambdaFunction.functionArn],
            })
        );

        // Grant Invoke Permission to Custom Resource
        rdsLambdaFunction.grantInvoke(customResourcerole);

        // Custom Resource to invoke Lambda Function on db stack creation creation
        const rdsCustomResource = new AwsCustomResource(this, "rdsInitCustomResource", {
            onCreate: {
                service: "Lambda",
                action: "invoke",
                parameters: {
                    FunctionName: rdsLambdaFunction.functionArn,
                    InvocationType: "RequestResponse",
                },
                physicalResourceId: PhysicalResourceId.of(
                    "rdsInitCustomResource"
                ),
            },
            policy: AwsCustomResourcePolicy.fromSdkCalls({
                resources: [rdsLambdaFunction.functionArn],
            }),
            role: customResourcerole,
        });

        // run rdsCustomResource after creation (Add dependency)
        rdsCustomResource.node.addDependency(dbProxy);
        rdsCustomResource.node.addDependency(instance);


        // Export DB SG ID
        new cdk.CfnOutput(this, "DB_SG_ID", {
            value: dbSG.securityGroupId,
            description: "DB Security Group ID",
            exportName: "dbSGID",
        });

        // Export DB Proxy Endpoint
        new cdk.CfnOutput(this, "DB_ENDPOINT_ADDRESS", {
            value: dbProxy.endpoint,
            description: "DB Proxy endpoint",
            exportName: "dbEndpointAddress",
        });

        // Export DB instance secret arn
        new cdk.CfnOutput(this, "DB_SECRET_ARN", {
            value: instance.secret?.secretFullArn || "",
            description: "DB instance secret arn",
            exportName: "dbSecretARN",
        });
    }
}
