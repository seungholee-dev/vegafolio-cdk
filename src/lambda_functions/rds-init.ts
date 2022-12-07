import { Context, APIGatewayProxyCallback, APIGatewayEvent } from "aws-lambda";
import * as aws from "aws-sdk";
import * as mysql from "mysql";

export const handler = async (
    event: APIGatewayEvent,
    context: Context,
    callback: APIGatewayProxyCallback
) => {
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

        const connection = mysql.createConnection({
            host: host, // Database EndPoint Address
            user: username,
            password: password,
            database: database,
        });

        connection.connect();
        return new Promise((resolve, reject) => {
            connection.query(
                "CREATE TABLE seungho_table (id INT);",
                (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ statusCode: 200, body: result });
                    }
                }
            );
        });

        // connection.query("INSERT INTO seungho_table VALUES (10);", (err, result) => {})
        // connection.query("SELECT * FROM seungho_table", (err, result) => {
        //     console.log(result);
        // })

        connection.end();
    } catch (e) {
        console.log(e);
        console.log("ERROR WHILE TRYING TO CONNECT TO DB FROM LAMBDA");
        return {
            error: e
        }
    }
};
