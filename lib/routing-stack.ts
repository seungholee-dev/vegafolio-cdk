import * as cdk from "aws-cdk-lib";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { LogGroupLogDestination } from "aws-cdk-lib/aws-apigateway";
import { EC2Stack } from "./ec2-stack";
import { CfnOutput } from "aws-cdk-lib";

export class RoutingStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);

        // Create route 53 zone
        const vegafolioZone = new route53.PublicHostedZone(this, "MyZone", {
            zoneName: "vegafolio.com",
        });

        // Find Existing Hosted Zone
        // const vegafolioZone = route53.HostedZone.fromHostedZoneAttributes(
        //     this,
        //     "ExistingVegafolioZone",
        //     {
        //         zoneName: "vegafolio.com",
        //         hostedZoneId: "Z0165697230RURBW64R3T",
        //     }
        // );

        // MX Record (Email)
        new route53.MxRecord(this, "MxRecord", {
            zone: vegafolioZone,
            recordName: "vegafolio.com",
            values: [
                {
                    hostName: "aspmx.l.google.com.",
                    priority: 1,
                },
                {
                    hostName: "alt1.aspmx.l.google.com.",
                    priority: 5,
                },
                {
                    hostName: "alt2.aspmx.l.google.com.",
                    priority: 5,
                },
                {
                    hostName: "alt3.aspmx.l.google.com.",
                    priority: 10,
                },
                {
                    hostName: "alt4.aspmx.l.google.com.",
                    priority: 10,
                },
            ],
        });

        // const ec2AppPublicIPAddress = cdk.Fn.importValue(
        //     "ec2AppPublicIPAddress"
        // );

        // // A -> app.vegafolio.com (EC2)
        // new route53.ARecord(this, "ARecord", {
        //     zone: vegafolioZone,
        //     recordName: "app.vegafolio.com",
        //     target: route53.RecordTarget.fromIpAddresses(ec2AppPublicIPAddress),
        // });

        // // A -> www.vegafolio.com (Cloudfront)

        // A -> vegafolio.com (Cloudfront)

        // NS -> dev.vegafolio.com

        // NS -> staging.vegafolio.com


        // Export ID of created Hosted Zone
        const hostZoneID = new CfnOutput(this, "hostZoneID", {
            value: vegafolioZone.hostedZoneId,
            description: "ID of Hosted Zone on Route 53",
            exportName: "hostZoneID"
        })
    }
}
