import * as cdk from "aws-cdk-lib";
import { CfnOutput } from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from "aws-cdk-lib/aws-iam";
import * as route53 from "aws-cdk-lib/aws-route53";
import { readFileSync } from "fs";

export interface EC2StackProps extends cdk.StackProps {
    vpc: ec2.Vpc;
}

export class EC2Stack extends cdk.Stack {
    private vpc: ec2.Vpc;

    constructor(scope, id, props: EC2StackProps) {
        super(scope, id, props);

        // Shared VPC
        const vpc = props.vpc;

        // Security Group
        const webserverSG = new ec2.SecurityGroup(this, "webserver-sg", {
            vpc,
            securityGroupName: "webserver-sg",
            allowAllOutbound: true,
        });

        webserverSG.addIngressRule(
            ec2.Peer.anyIpv4(),
            ec2.Port.tcp(22),
            "allow SSH access from anywhere"
        );

        webserverSG.addIngressRule(
            ec2.Peer.anyIpv4(),
            ec2.Port.tcp(80),
            "allow HTTP traffic from anywhere"
        );

        webserverSG.addIngressRule(
            ec2.Peer.anyIpv4(),
            ec2.Port.tcp(443),
            "allow HTTPS traffic from anywhere"
        );

        // IAM ROLE
        const webserverRole = new iam.Role(this, "webserver-role", {
            assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName(
                    "AmazonS3FullAccess"
                ),
            ],
        });

        // EC2
        const ec2Instance = new ec2.Instance(this, "vegafolio-ec2", {
            vpc,
            vpcSubnets: {
                subnetType: ec2.SubnetType.PUBLIC,
            },
            role: webserverRole,
            securityGroup: webserverSG,
            instanceType: ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE2,
                ec2.InstanceSize.MICRO
            ),

            // Machine Image: Ubuntu
            machineImage: ec2.MachineImage.genericLinux({
                "us-west-1": "ami-064562725417500be",
            }),
            
            // Helps SSH into the instance
            // You need to create a key pair in AWS console and download the .pem file in named seungho-key-pair.pem
            keyName: "seungho-key-pair",
        });

        // Find Existing Hosted Zone and add A record to existing DNS
        const vegafolioZone = route53.HostedZone.fromHostedZoneAttributes(
            this,
            "ExistingVegafolioZone",
            {
                zoneName: "vegafolio.com",
                hostedZoneId: cdk.Fn.importValue("hostZoneID"),
            }
        );
        new route53.ARecord(this, "ARecord", {
            zone: vegafolioZone,
            recordName: "app.vegafolio.com",
            target: route53.RecordTarget.fromIpAddresses(ec2Instance.instancePublicIp)
        });

        // EC2 StartUp script
        const userDataScript = readFileSync("./lib/user-data.sh", "utf8");
        ec2Instance.addUserData(userDataScript);

        // // Export IP Address using Cloudfront output
        // const ipAddressOutput = new CfnOutput(this, "serverIPAddress", {
        //     value: ec2Instance.instancePublicIp,
        //     description: "Public IP Address of EC2 Instance created",
        //     exportName: "ec2AppPublicIPAddress",
        // });

        // Export ID of webserver security group
        const webserverSGOutput = new CfnOutput(this, "webserverSGOutput", {
            value: webserverSG.securityGroupId,
            description: "ID of webserver security group",
            exportName: "webserverSGOutput",
        });
    }
}
