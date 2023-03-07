import { Context, APIGatewayProxyCallback, APIGatewayEvent } from "aws-lambda";
import * as aws from "aws-sdk";
import * as mysql from "mysql";
import { parse } from "path";

export const handler = async (
    event: APIGatewayEvent,
    context: Context,
    callback: APIGatewayProxyCallback
) => {
    let connection;
    const host = process.env.DB_ENDPOINT_ADDRESS || "";
    const database = process.env.DB_NAME || "";
    const dbSecretARN = process.env.DB_SECRET_ARN || "";
    let password;
    let username;

    // Check if SecretManager is responding (e.g. on Local this shouldn't work)
    try {
        const secretManager = new aws.SecretsManager({
            region: "us-west-1",
        });

        const secretParams: aws.SecretsManager.GetSecretValueRequest = {
            SecretId: dbSecretARN,
        };

        const dbSecret = await secretManager
            .getSecretValue(secretParams)
            .promise();
        const secretString = dbSecret.SecretString || "";

        if (!secretString) {
            throw new Error("secret string is empty");
        }

        const parsedSecretString = JSON.parse(secretString);
        password = parsedSecretString.password;
        username = parsedSecretString.username;
    } catch (e) {
        // Local env (if error caused when fetching from secret manager)
        password = "password";
        username = "root";
    }

    try {
        connection = mysql.createConnection({
            host: host, // Database EndPoint Address
            user: username,
            password: password,
            database: database,
        });

        connection.connect();
    } catch (e) {
        console.log("ERROR WHILE TRYING TO CONNECT TO DB FROM LAMBDA");
        return {
            statusCode: 400,
            body: JSON.stringify(e),
        };
    }

    let queryResult = new Promise(function (resolve, reject) {
        const sqlQuery = "SELECT * FROM company";
        connection.query(sqlQuery, (err, results) => {
            if (err) {
                reject({
                    statusCode: 400,
                    body: JSON.stringify(err),
                });
            } else {
                resolve({
                    statusCode: 200,
                    body: JSON.stringify(results),
                });
            }
        });
    });

    const response = queryResult
        .then((res) => {
            return { statusCode: 200, body: JSON.stringify(res) };
        })
        .catch((err) => {
            return { statusCode: 400, body: JSON.stringify(err) };
        });
    connection.end();
    return response;
};
