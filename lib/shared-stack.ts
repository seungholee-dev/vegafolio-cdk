import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";

export class SharedStack extends cdk.Stack {

    // Shared VPC
    public readonly vpc: ec2.Vpc;

    constructor(scope, id, props) {
        super(scope, id, props);

        // VPC
        this.vpc = new ec2.Vpc(this, "vegafolio-vpc", {
            cidr: "10.0.0.0/16",
            vpcName: 'vegafolio-vpc',
            subnetConfiguration: [
                {
                    // Public Subnet
                    name: "public-vpc",
                    cidrMask: 24,
                    subnetType: ec2.SubnetType.PUBLIC,
                },
                {
                    // Private Subnet with NAT Gateway
                    name: "private-vpc",
                    cidrMask: 24,
                    subnetType: ec2.SubnetType.PRIVATE_ISOLATED,

                }
            ],
        });
    }
}
