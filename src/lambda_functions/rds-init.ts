import { Context, APIGatewayProxyCallback, APIGatewayEvent } from "aws-lambda";
import * as aws from "aws-sdk";
import * as mysql from "mysql";
import * as fs from "fs";

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

        const connectionPool = mysql.createPool({
            host: host, // Database EndPoint Address
            user: username,
            password: password,
            database: database,
            connectionLimit: 10,
            connectTimeout: 20000,
            waitForConnections: true,
            enableKeepAlive: true,
            multipleStatements: true,
        });

        // Load SQL file contents
        const query = await fs
            .readFileSync("table-creation.sql", "utf8")
            .toString()
            .trim();

        // Execute SQL query
        return await new Promise((resolve, reject) => {
            connectionPool.query(query, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve({ statusCode: 200, body: result });
                }
            });
        }).finally(() => {
        });
    } catch (e) {
        console.log(e);
        console.log("ERROR WHILE TRYING TO CONNECT TO DB FROM LAMBDA");
        return {
            error: e,
        };
    }
};
