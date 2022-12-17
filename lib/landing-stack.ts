import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as iam from "aws-cdk-lib/aws-iam";
import * as codedeploy from "aws-cdk-lib/aws-codedeploy";
import { CloudFrontTarget } from "aws-cdk-lib/aws-route53-targets";
import { Duration, RemovalPolicy } from "aws-cdk-lib";
import { ViewerProtocolPolicy } from "aws-cdk-lib/aws-cloudfront";

export interface LandingStackProps extends cdk.StackProps {
    vpc: ec2.Vpc;
}

export class LandingStack extends cdk.Stack {
    private vpc: ec2.Vpc;

    constructor(scope, id, props: LandingStackProps) {
        super(scope, id, props);

        // Shared VPC
        const vpc = props.vpc;

        // S3 Bucket
        const landingPageBucket = new s3.Bucket(this, "LandingPageBucket", {
            bucketName: "vegafolio-landing-page-bucket",
            removalPolicy: RemovalPolicy.DESTROY,
        });

        // Route 53
        const vegafolioZone = route53.HostedZone.fromHostedZoneAttributes(
            this,
            "ExistingVegafolioZone",
            {
                zoneName: "vegafolio.com",
                hostedZoneId: cdk.Fn.importValue("hostZoneID"),
            }
        );

        // Certification
        const certificate = new acm.DnsValidatedCertificate(
            this,
            "Certificate",
            {
                domainName: "*.vegafolio.com",
                hostedZone: vegafolioZone,
                region: "us-east-1",
                subjectAlternativeNames: [
                    "www.vegafolio.com",
                    "*.vegafolio.com",
                    "vegafolio.com",
                ],
            }
        );

        // Cloudfront OAI
        const cloudfrontOAI = new cloudfront.OriginAccessIdentity(
            this,
            "CloudFrontOriginAccessIdentity"
        );

        landingPageBucket.addToResourcePolicy(
            new iam.PolicyStatement({
                actions: ["s3:GetObject"],
                resources: [landingPageBucket.arnForObjects("*")],
                principals: [
                    new iam.CanonicalUserPrincipal(
                        cloudfrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId
                    ),
                ],
            })
        );

        // Cloudfront Security Header Policy -> For better security
        // const responseHeaderPolicy = new cloudfront.ResponseHeadersPolicy(
        //     this,
        //     "SecurityHeadersResponseHeaderPolicy",
        //     {
        //         comment: "Security headers response header policy",

        //         securityHeadersBehavior: {
        //             contentSecurityPolicy: {
        //                 override: true,
        //                 contentSecurityPolicy: "default-src 'self'",
        //             },
        //             strictTransportSecurity: {
        //                 override: true,
        //                 accessControlMaxAge: Duration.days(2 * 365),
        //                 includeSubdomains: true,
        //                 preload: true,
        //             },
        //             contentTypeOptions: {
        //                 override: true,
        //             },

        //             referrerPolicy: {
        //                 override: true,
        //                 referrerPolicy:
        //                     cloudfront.HeadersReferrerPolicy
        //                         .STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
        //             },

        //             xssProtection: {
        //                 override: true,
        //                 protection: true,
        //                 modeBlock: true,
        //             },
        //             frameOptions: {
        //                 override: true,
        //                 frameOption: cloudfront.HeadersFrameOption.DENY,
        //             },
        //         },
        //     }
        // );

        // Cloudfront
        const cloudfrontDistribution = new cloudfront.Distribution(
            this,
            "CloudFrontDistribution",
            {
                certificate,
                domainNames: ["vegafolio.com", "www.vegafolio.com"],
                defaultRootObject: "index.html",
                defaultBehavior: {
                    origin: new origins.S3Origin(landingPageBucket, {
                        originAccessIdentity: cloudfrontOAI,
                    }),
                    // originRequestPolicy:
                        // cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
                    
                    viewerProtocolPolicy:
                        ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    // responseHeadersPolicy: responseHeaderPolicy,
                    responseHeadersPolicy: cloudfront.ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS, // This works! -> Needs to be changed after studying.
                    cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED, // Cache Disabled cause the updated landing page is not auto updated.
                },
            }
        );

        // Adding Records to the hostzone
        let cloudFrontTarget = new CloudFrontTarget(cloudfrontDistribution);

        new route53.ARecord(this, "vegafolio.com", {
            zone: vegafolioZone,
            recordName: "vegafolio.com",
            target: route53.RecordTarget.fromAlias(cloudFrontTarget),
        });

        new route53.ARecord(this, "www.vegafolio.com", {
            zone: vegafolioZone,
            recordName: "www.vegafolio.com",
            target: route53.RecordTarget.fromAlias(cloudFrontTarget),
        });
    }
}
