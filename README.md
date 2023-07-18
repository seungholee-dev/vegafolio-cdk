# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template

## How to start on this project

1. Go to Firebase Console (poream3387@gmail.com)
2. Go to Vegafolio
3. Go to project settings
4. Go to Service Account
5. Press '새 비공개 키 생성' 
6. This will download a key file for you. 
7. Rename this to `firebase-service-account-secret.json` and add this to `src/lambda_functions`
