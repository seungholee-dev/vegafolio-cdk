#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { SharedStack } from "../lib/shared-stack";
import { EC2Stack } from "../lib/ec2-stack";
import { DeployStack } from "../lib/deploy-stack";
import { RoutingStack } from "../lib/routing-stack";
import { DatabaseStack } from "../lib/database-stack";
import { LandingStack } from "../lib/landing-stack";

const app = new cdk.App();

// SharedStack (VPC)
const sharedStack = new SharedStack(app, "shared-stack", {
    stackName: "shared-stack",
    env: {
        region: process.env.CDK_DEFAULT_REGION,
        account: process.env.CDK_DEFAULT_ACCOUNT,
    },
});

// EC2 Stack
const ec2Stack = new EC2Stack(app, "ec2-stack", {
    vpc: sharedStack.vpc,
    stackName: "ec2-stack",
    env: {
        region: process.env.CDK_DEFAULT_REGION,
        account: process.env.CDK_DEFAULT_ACCOUNT,
    },
});

// CodeDeploy Stack
const deployStack = new DeployStack(app, "deploy-stack", {
    stackName: "deploy-stack",
    env: {
        region: process.env.CDK_DEFAULT_REGION,
        account: process.env.CDK_DEFAULT_ACCOUNT,
    },
});

// Routing Stack
const routingStack = new RoutingStack(app, "routing-stack", {
    stackName: "routing-stack",
    env: {
        region: process.env.CDK_DEFAULT_REGION,
        account: process.env.CDK_DEFAULT_ACCOUNT,
    },
});

// Database Stack
const databaseStack = new DatabaseStack(app, "database-stack", {
    vpc: sharedStack.vpc,
    stackName: "database-stack",
    env: {
        region: process.env.CDK_DEFAULT_REGION,
        account: process.env.CDK_DEFAULT_ACCOUNT,
    },
});

// Landing Page Stack - Cloudfront, Route53, S3
const landingStack = new LandingStack(app, "landing-stack", {
    vpc: sharedStack.vpc,
    stackName: "landing-stack",
    env: {
        region: process.env.CDK_DEFAULT_REGION,
        account: process.env.CDK_DEFAULT_ACCOUNT,
    },
});

// Adding Dependency to stacks!!
ec2Stack.addDependency(sharedStack);
databaseStack.addDependency(sharedStack);
landingStack.addDependency(sharedStack)
