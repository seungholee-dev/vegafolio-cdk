import * as rds from "aws-cdk-lib/aws-rds";
import * as cdk from "aws-cdk-lib";

export class SharedStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // RDS
        const instance = new rds.DatabaseInstance(
            this,
            "vegafolio-db-instance",
            {
                vpc,
                engine: rds.DatabaseInstanceEngine.mysql({
                    version: rds.MysqlEngineVersion.VER_8_0_28,
                }),
                instanceType: ec2.InstanceType.of(
                    ec2.InstanceClass.BURSTABLE2,
                    ec2.InstanceSize.MICRO
                ),
            }
        );
    }
}
