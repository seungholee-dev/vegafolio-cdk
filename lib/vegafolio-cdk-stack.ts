import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as path from "path";

export class VegafolioCdkStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // The code that defines your stack goes here
        new lambda.Function(this, "Test Function", {
            runtime: lambda.Runtime.NODEJS_16_X,
            handler: "index.main",
            code: lambda.Code.fromAsset(
                path.join(__dirname, "/../src/my-lambda")
            ),
        });
    }
}
