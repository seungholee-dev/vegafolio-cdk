const admin = require("firebase-admin");
const serviceCredential = require('./firebase-service-account-secret.json')
admin.initializeApp({
    credential: admin.credential.cert(serviceCredential)
});

exports.handler = function (event, context, callback) {
    var jwt = event.authorizationToken; // Header needs to be "Authorization" and when retrieving it has to be authorizationToken

    admin
        .auth()
        .verifyIdToken(jwt)
        .then((response) => {
            callback(null, generatePolicy("user", "Allow", event.methodArn));
        })
        .catch((e) => {
            callback(null, generatePolicy("user", "Deny", event.methodArn));
        });
};

// Help function to generate an IAM policy
var generatePolicy = function (principalId, effect, resource) {
    var authResponse = {};

    authResponse.principalId = principalId;
    if (effect && resource) {
        let policyDocument = {};
        policyDocument.Version = "2012-10-17";
        policyDocument.Statement = [];

        let statementOne = {};
        statementOne.Action = "execute-api:Invoke";
        statementOne.Effect = effect;
        statementOne.Resource = resource;

        policyDocument.Statement[0] = statementOne;
        authResponse.policyDocument = policyDocument;
    }

    console.log(authResponse);

    // Optional output with custom properties of the String, Number or Boolean type.
    // authResponse.context = {
    //     stringKey: "Success!",
    //     numberKey: 123,
    //     booleanKey: true,
    // };
    return authResponse;
};
