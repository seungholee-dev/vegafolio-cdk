import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";

export class APIStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);

        //  Authorizer Lambda Function
        const lambdaAuthorizer = new NodejsFunction(
            this,
            "Lambda Function - Authorizer",
            {
                runtime: lambda.Runtime.NODEJS_16_X,
                handler: "handler",
                functionName: "TestTest",
                entry: "./src/lambda_functions/authorizer.js",
                environment: {
                    GOOGLE_APPLICATION_CREDENTIALS:
                        "vegafolio-dafea-firebase-adminsdk-9o6i0-21b4b88a93.json",
                },
            }
        );

        // APIGateway Authorizer
        const auth = new apigateway.TokenAuthorizer(
            this,
            "APIGateWay Token Authorizer",
            {
                handler: lambdaAuthorizer,
            }
        );

        // Backend AWS Lambda function
        const backend = new NodejsFunction(this, "Backend", {
            runtime: lambda.Runtime.NODEJS_16_X,
            handler: "handler",
            entry: "./src/lambda_functions/backend.ts",
        });
        

        // Vegafolio - REST API
        const api = new apigateway.LambdaRestApi(this, "Vegafolio REST API", {
            handler: backend,
            defaultMethodOptions: {
                authorizer: auth,
            },
        });
    }
}
