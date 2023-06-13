import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import * as iam from "aws-cdk-lib/aws-iam";

import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { Duration } from "aws-cdk-lib";

export interface APISTACKProps extends cdk.StackProps {
    vpc: ec2.Vpc;
}

export class APIStack extends cdk.Stack {
    private vpc: ec2.Vpc;

    constructor(scope, id, props) {
        super(scope, id, props);

        // Shared VPC
        const vpc = props.vpc;

        // Create Lambda Security Group
        const lambdaSG = new ec2.SecurityGroup(this, "lambda-sg", {
            vpc,
            securityGroupName: "lambda-sg",
        });


        // Import DB Security Group
        const dbSGID = cdk.Fn.importValue("dbSGID");
        const dbSG = ec2.SecurityGroup.fromSecurityGroupId(
            this,
            "dbSG",
            dbSGID
        );

        // Get DB instance address, secretARN and proxyARN
        const dbSecretARN = cdk.Fn.importValue("dbSecretARN");
        const dbProxyARN = cdk.Fn.importValue("dbProxyARN");

        // Add Ingress Rules to DB Security Group (Who is allowed to access this instance)
        dbSG.addIngressRule(
            lambdaSG,
            ec2.Port.tcp(3306), // MySQL port
            "Lambda to MySQL DB"
        );

        // // Create Lambda Function to initialize the DB with tables and data.
        // const rdsLambdaFunction = new NodejsFunction(this, "rdsLambdaFN", {
        //     entry: "./src/lambda_functions/rds-init.ts",
        //     runtime: Runtime.NODEJS_16_X,
        //     timeout: Duration.minutes(3), // Preventing coldstart time
        //     functionName: "rds-init-function",
        //     environment: {
        //         DB_ENDPOINT_ADDRESS: dbProxyARN,
        //         DB_NAME: "vegafoliodb",
        //         DB_SECRET_ARN: dbSecretARN, // Not Fetching Password directly but via SecretARN for security :)
        //     },
        //     vpc,
        //     vpcSubnets: vpc.selectSubnets({
        //         subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        //     }),
        //     bundling: {
        //         externalModules: [
        //             "aws-sdk", // No Need to include AWS SDK as we are using native aws-sdk.
        //         ],
        //     },
        //     securityGroups: [lambdaSG],
        // });

        // TODO Custom Resource to initialize the DB
        // Triggered when the DB is created
        

        //  Authorizer Lambda Function
        const lambdaAuthorizer = new NodejsFunction(
            this,
            "Lambda Function - Authorizer",
            {
                runtime: lambda.Runtime.NODEJS_16_X,
                handler: "handler",
                functionName: "authorizer-function",
                entry: "./src/lambda_functions/authorizer.js",
                // environment: {
                //     GOOGLE_APPLICATION_CREDENTIALS:
                //         // "vegafolio-dafea-firebase-adminsdk-9o6i0-21b4b88a93.json",
                //         "firebase-service-account-secret.json",
                // },
            }
        );

        // APIGateway Authorizer
        const auth = new apigateway.TokenAuthorizer(
            this,
            "APIGateWay Token Authorizer",
            {
                handler: lambdaAuthorizer,
                resultsCacheTtl: Duration.minutes(0), // Disable Authorizer caching
            }
        );

        // Backend Role
        const backendRole = new iam.Role(this, "backendRole", {
            assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
        });
        backendRole.addManagedPolicy(
            iam.ManagedPolicy.fromAwsManagedPolicyName(
                "SecretsManagerReadWrite"
            )
        );
        backendRole.addManagedPolicy(
            iam.ManagedPolicy.fromAwsManagedPolicyName(
                "service-role/AWSLambdaVPCAccessExecutionRole"
            )
        );

        // Backend AWS Lambda function
        // const backend = new NodejsFunction(this, "Backend", {
        //     runtime: lambda.Runtime.NODEJS_16_X,
        //     functionName: "vegafolio-backend",
        //     handler: "handler",
        //     entry: "./src/lambda_functions/backend.ts",
        //     environment: {
        //         DB_ENDPOINT_ADDRESS: cdk.Fn.importValue("dbEndpointAddress"),
        //         DB_NAME: "vegafoliodb",
        //         DB_SECRET_ARN: cdk.Fn.importValue("dbSecretARN"),
        //     },
        //     vpc,
        //     vpcSubnets: vpc.selectSubnets({
        //         subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        //     }),
        //     bundling: {
        //         externalModules: [
        //             "aws-sdk", // No Need to include AWS SDK as we are using native aws-sdk.
        //         ],
        //     },
        //     securityGroups: [ExistingLambdaSG],
        //     role: backendRole,
        // });

        // Vegafolio - REST API
        // const api = new apigateway.LambdaRestApi(this, "Vegafolio REST API", {
        //     handler: backend,
        //     defaultMethodOptions: {
        //         authorizer: auth,
        //     },
        //     proxy: true
        // });

        const api = new apigateway.RestApi(this, "VegafolioRESTAPI", {
            // defaultMethodOptions: {
            //     authorizer: auth
            // },
            restApiName: "vegafolio-rest-api",
        });

        //  Company Function
        const getCompanyFunction = new NodejsFunction(
            this,
            "getCompanyFunction",
            {
                runtime: lambda.Runtime.NODEJS_16_X,
                functionName: "get-company",
                handler: "handler",
                entry: "./src/lambda_functions/getcompany.ts",
                environment: {
                    DB_ENDPOINT_ADDRESS: dbProxyARN,
                    DB_NAME: "vegafoliodb",
                    DB_SECRET_ARN: dbSecretARN,
                },
                vpc,
                // vpcSubnets: vpc.selectSubnets({
                //     subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
                // }),
                bundling: {
                    externalModules: [
                        "aws-sdk", // No Need to include AWS SDK as we are using native aws-sdk.
                    ],
                },
                securityGroups: [lambdaSG],
                role: backendRole,
            }
        );

        //  Company Function
        const postCompanyFunction = new NodejsFunction(
            this,
            "postCompanyFunction",
            {
                runtime: lambda.Runtime.NODEJS_16_X,
                functionName: "post-company",
                handler: "handler",
                entry: "./src/lambda_functions/postcompany.ts",
                environment: {
                    DB_ENDPOINT_ADDRESS: dbProxyARN,
                    DB_NAME: "vegafoliodb",
                    DB_SECRET_ARN: dbSecretARN
                },
                vpc,
                // vpcSubnets: vpc.selectSubnets({
                //     subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
                // }),
                bundling: {
                    externalModules: [
                        "aws-sdk", // No Need to include AWS SDK as we are using native aws-sdk.
                    ],
                },
                securityGroups: [lambdaSG],
                role: backendRole,
            }
        );

        const companyResource = api.root.addResource("company");

        companyResource.addMethod(
            "GET",
            new apigateway.LambdaIntegration(getCompanyFunction),
            {
                authorizer: auth,
            }
        );

        companyResource.addMethod(
            "POST",
            new apigateway.LambdaIntegration(postCompanyFunction),
            {
                authorizer: auth,
            }
        );
    }
}
