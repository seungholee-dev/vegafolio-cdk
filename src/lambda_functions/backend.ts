import { Context, APIGatewayProxyCallback, APIGatewayEvent } from "aws-lambda";
import * as aws from "aws-sdk";
import * as mysql from "mysql";

export const handler = async (
    event: APIGatewayEvent,
    context: Context,
    callback: APIGatewayProxyCallback
) => {
    let connection;
    try {
        const host = process.env.DB_ENDPOINT_ADDRESS || "";
        const database = process.env.DB_NAME || "";
        const dbSecretARN = process.env.DB_SECRET_ARN || "";
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

        const { password, username } = JSON.parse(secretString);

        connection = mysql.createConnection({
            host: host, // Database EndPoint Address
            user: username,
            password: password,
            database: database,
        });

        connection.connect();
    } catch (e) {
        console.log(e);
        console.log("ERROR WHILE TRYING TO CONNECT TO DB FROM LAMBDA");
        return {
            error: e,
        };
    }
    
    await connection.query("SHOW TABLES", (err, results, fields) => {
        callback(err, results);
        console.log(results)
    });
};
