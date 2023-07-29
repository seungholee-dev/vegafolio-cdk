import * as aws from "aws-sdk";
import * as mysql from "mysql";

export const getDbConnection = async () => {
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

    const connection = mysql.createConnection({
        host: host, // Database EndPoint Address
        user: username,
        password: password,
        database: database,
    });

    connection.connect();

    return connection;
};

export const queryDb = (connection, sqlQuery, params = []) => {
    return new Promise((resolve, reject) => {
        connection.query(sqlQuery, params, (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
};
