import * as rds from "aws-cdk-lib/aws-rds";
import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2"

export interface DatabaseStackProps extends cdk.StackProps {
    vpc: ec2.Vpc;
}


export class DatabaseStack extends cdk.Stack {
    private vpc: ec2.Vpc;
    private ec2Instance: ec2.Instance

    constructor(scope, id, props: DatabaseStackProps) {
        super(scope, id, props);

        // Shared VPC
        const vpc = props.vpc;

        // RDS
        const instance = new rds.DatabaseInstance(
            this,
            "vegafolio-db-instance",
            {
                vpc,
                vpcSubnets: {
                    subnetType: ec2.SubnetType.PRIVATE_ISOLATED
                },
                engine: rds.DatabaseInstanceEngine.mysql({
                    version: rds.MysqlEngineVersion.VER_8_0_28,
                }),
                instanceType: ec2.InstanceType.of(
                    ec2.InstanceClass.BURSTABLE2,
                    ec2.InstanceSize.MICRO
                ),
                instanceIdentifier: "vegafolio-db-instance",
                databaseName: 'vegafoliodb',
            }
        );
    }
}
