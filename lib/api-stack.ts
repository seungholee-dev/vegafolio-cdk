import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import * as iam from "aws-cdk-lib/aws-iam";

import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
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

        //  Authorizer Lambda Function
        const lambdaAuthorizer = new NodejsFunction(
            this,
            "Lambda Function - Authorizer",
            {
                runtime: lambda.Runtime.NODEJS_16_X,
                handler: "handler",
                functionName: "authorizer-function",
                entry: "./src/lambda_functions/authorizer.js",
                environment: {
                    GOOGLE_APPLICATION_CREDENTIALS:
                        // "vegafolio-dafea-firebase-adminsdk-9o6i0-21b4b88a93.json",
                        "firebase-service-account-secret.json",
                },
            }
        );

        // APIGateway Authorizer
        const auth = new apigateway.TokenAuthorizer(
            this,
            "APIGateWay Token Authorizer",
            {
                handler: lambdaAuthorizer,
                resultsCacheTtl: Duration.minutes(0) // Disable Authorizer caching
            }
        );

        // Get Lambda SG
        const ExistingLambdaSG = ec2.SecurityGroup.fromSecurityGroupId(
            this,
            "Test",
            cdk.Fn.importValue("lambdaSGID")
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
        const getCompanyFunction = new NodejsFunction(this, "getCompanyFunction", {
            runtime: lambda.Runtime.NODEJS_16_X,
            functionName: "get-company",
            handler: "handler",
            entry: "./src/lambda_functions/getcompany.ts",
            environment: {
                DB_ENDPOINT_ADDRESS: cdk.Fn.importValue("dbEndpointAddress"),
                DB_NAME: "vegafoliodb",
                DB_SECRET_ARN: cdk.Fn.importValue("dbSecretARN"),
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
            securityGroups: [ExistingLambdaSG],
            role: backendRole,
        });

        //  Company Function
        const postCompanyFunction = new NodejsFunction(this, "postCompanyFunction", {
            runtime: lambda.Runtime.NODEJS_16_X,
            functionName: "post-company",
            handler: "handler",
            entry: "./src/lambda_functions/postcompany.ts",
            environment: {
                DB_ENDPOINT_ADDRESS: cdk.Fn.importValue("dbEndpointAddress"),
                DB_NAME: "vegafoliodb",
                DB_SECRET_ARN: cdk.Fn.importValue("dbSecretARN"),
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
            securityGroups: [ExistingLambdaSG],
            role: backendRole,
        });

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
