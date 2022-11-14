#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { SharedStack } from "../lib/shared-stack";
import { EC2Stack } from "../lib/ec2-stack";
import { DeployStack } from "../lib/deploy-stack";
import { RoutingStack } from "../lib/routing-stack";

const app = new cdk.App();

// SharedStack
const sharedStack = new SharedStack(app, "SharedStack", {
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

// Adding Dependency to stacks!!
// routingStack.addDependency(ec2Stack)
