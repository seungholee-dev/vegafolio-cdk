# Vegafolio AWS CDK


## Github Rules

We follow Conventional Commits

Reference
- [A Simplified Convention for Naming Branches and Commits in Git](https://dev.to/varbsan/a-simplified-convention-for-naming-branches-and-commits-in-git-il4)

- [Naming conventions for Git Branches — a Cheatsheet](https://medium.com/@abhay.pixolo/naming-conventions-for-git-branches-a-cheatsheet-8549feca2534)

### Commits

#### Template

> git commit -m 'category(field): do something'
> git commit -m 'feat(profile): add profile picture upload'

#### category

- feature: A new feature for the user or a particular improvement to existing functionalities.
- fix: A bug fix.
- refactor: Code changes that neither fix a bug nor add a feature.
- doc: Documentation only changes.
- chore: Simple changes that are not part of the application's logic or business features.

### Branches

### Template

> feature/T-123-new-login-system
> release/v2.0.1

#### prefixes
- feature: New feature or enhancement.
- bugfix: A fix for a certain issue.
- hotfix: Quick fixes to the codebase applied directly to production.
- release: Preparing a new product iteration.
- docs: Documentation only changes.


### For Deployment 

### Others

- Delete branch after merged


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
