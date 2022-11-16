import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";

export class SharedStack extends cdk.Stack {

    // Share VPC
    public readonly vpc: ec2.Vpc;

    constructor(scope, id, props) {
        super(scope, id, props);

        // VPC
        this.vpc = new ec2.Vpc(this, "vegafolio-vpc", {
            cidr: "10.0.0.0/16",
            natGateways: 0,
            vpcName: 'vegafolio-vpc',
            subnetConfiguration: [
                {
                    name: "public-vpc",
                    cidrMask: 24,
                    subnetType: ec2.SubnetType.PUBLIC,
                },
                {
                    name: "private-vpc",
                    cidrMask: 24,
                    subnetType: ec2.SubnetType.PRIVATE_ISOLATED
                }
            ],
        });
    }
}
