import { Context, APIGatewayProxyCallback, APIGatewayEvent } from "aws-lambda";
import { getDbConnection, queryDb } from "../db-connector";

export const handler = async (
    event: APIGatewayEvent,
    context: Context,
    callback: APIGatewayProxyCallback
) => {
    let connection;
    let queryResult;
    const sqlQuery = "SELECT * FROM company";

    try {
        connection = await getDbConnection();
        queryResult = await queryDb(connection, sqlQuery);
        connection.end();
    } catch (e) {
        console.log("ERROR: ", e);
        return {
            statusCode: 400,
            body: JSON.stringify(e),
        };
    }
    return {
        statusCode: 200,
        body: JSON.stringify(queryResult),
    };
};