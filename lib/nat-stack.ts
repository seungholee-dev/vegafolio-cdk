import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";

export interface NatStackProps extends cdk.StackProps {
    vpc: ec2.Vpc;
}

export class NatStack extends cdk.Stack {
    private vpc: ec2.Vpc;

    constructor(scope, id, props: NatStackProps) {
        super(scope, id, props);

        // Shared VPC
        const vpc = props.vpc;

        // NAT instance security Group
        const natSG = new ec2.SecurityGroup(this, "nat-sg", {
            vpc,
            securityGroupName: "nat-sg",
        });

        // NAT SG Inbound Rules
        natSG.addIngressRule(
            ec2.Peer.anyIpv4(),
            ec2.Port.tcp(22),
            "SSH from Anywhere"
        );
        natSG.addIngressRule(
            ec2.Peer.ipv4("10.0.0.0/16"),
            ec2.Port.tcp(443),
            "HTTPS from VPC"
        );
        natSG.addIngressRule(
            ec2.Peer.ipv4("10.0.0.0/16"),
            ec2.Port.tcp(80),
            "HTTP from VPC"
        );

        // NAT SG Outbound Rules
        natSG.addEgressRule(
            ec2.Peer.anyIpv4(),
            ec2.Port.tcp(443),
            "HTTPS to Anywhere"
        );
        natSG.addEgressRule(
            ec2.Peer.anyIpv4(),
            ec2.Port.tcp(80),
            "HTTP to Anywhere"
        );

        // NAT instance
        const natInstance = new ec2.Instance(this, "nat-instance", {
            vpc,
            vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
            instanceType: new ec2.InstanceType("t3.micro"),
            machineImage: new ec2.NatInstanceImage(),
            securityGroup: natSG,

            // Helps SSH into the instance
            // You need to create a key pair in AWS console and download the .pem file in named seungho-key-pair.pem
            keyName: "seungho-key-pair",

            // Need this for NAT instance
            sourceDestCheck: false,
        });

        const eip = new ec2.CfnEIP(this, "Nat EIP", {});

        // Attach Elastic IP to NAT instance
        const eIPAssociation = new ec2.CfnEIPAssociation(
            this,
            "Nat EIP Association",
            {
                instanceId: natInstance.instanceId,
                eip: eip.ref,
            }
        );

        new cdk.CfnOutput(this, "seunghotest", {
            value: `
            
            ${natInstance}
            ${natInstance.instanceId} ${natInstance.instancePrivateIp}
            ${natInstance.instancePublicIp}
            =============
            ${eip}
            ${eip.ref} ${eip.attrAllocationId}
            ${eIPAssociation.allocationId} ${eIPAssociation.eip} ${eIPAssociation.networkInterfaceId}
            ${eip.attrPublicIp} ${eIPAssociation.eip} ${eIPAssociation.instanceId}
            ${eip.instanceId} ${eip.logicalId} ${eip.transferAddress} 
            `,
            exportName: "seunghotest",
        });

        // // Update Private Subnet Route Table
        vpc.isolatedSubnets.forEach((subnet, index) => {
            const route = new ec2.CfnRoute(this, `NAT ROUTE${index + 1}`, {
                routeTableId: subnet.routeTable.routeTableId,
                destinationCidrBlock: "0.0.0.0/0",
                instanceId: natInstance.instanceId,
            });

            // Make sure NAT instance is created before creating route
            route.addDependsOn(eIPAssociation);
                    });

        // vpc.isolatedSubnets.forEach((subnet, index) => {
        //     (subnet as ec2.Subnet).addRoute("NAT ROUTE", {
        //         routerType: ec2.RouterType.INSTANCE,
        //         destinationCidrBlock: "0.0.0.0/0",
        //         routerId: natInstance.instanceId,
        //     });
        // });
    }
}
