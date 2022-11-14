import * as cdk from "aws-cdk-lib";
import * as codedeploy from "aws-cdk-lib/aws-codedeploy";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3 from "aws-cdk-lib/aws-s3";

declare const application: codedeploy.ServerApplication;
declare const revisionLocationProperty: codedeploy.CfnDeploymentGroup.RevisionLocationProperty;

export class DeployStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);

        // S3 Bucket for Deployment
        const deploymentBucket = new s3.Bucket(this, 'DeploymentBucket', {
            bucketName: "vegafolio-deployment-bucket",
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        })

        // Revision Property
        // const revisionLocationProperty = {
        //     revisionType: "S3",
        //     s3Location: {
        //         bucket: "vegafolio-deployment-bucket",
        //         key: 'out.zip',
        //         bundleType: 'zip'
        //     }
        // };

        // Deployment Application
        const application = new codedeploy.ServerApplication(
            this,
            "VegafolioApplication",
            {
                applicationName: "vegafolio-deploy-application",
            }
        );

        // IAM ROLE
        const groupRole = new iam.Role(this, "deployGroupRole", {
            assumedBy: new iam.ServicePrincipal('codedeploy.amazonaws.com'),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName(
                    "AmazonS3FullAccess"
                ),
                iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSCodeDeployRole"),
            ],
        });

        // Deployment Group
        const deploymentGroup = new codedeploy.ServerDeploymentGroup(
            this,
            "VegafolioDeploymentGroup",
            {
                application,
                deploymentGroupName: "vegafolio-deployment-group",
                ec2InstanceTags: new codedeploy.InstanceTagSet({
                    Name: ["ec2-stack/vegafolio-ec2"],
                }),
                deploymentConfig: codedeploy.ServerDeploymentConfig.ALL_AT_ONCE,
                role: groupRole,
            }
        );
    }
}
