import { Context, APIGatewayProxyCallback, APIGatewayEvent } from "aws-lambda";
import { getDbConnection, queryDb } from "../db-connector";

export const handler = async (
    event: APIGatewayEvent,
    context: Context,
    callback: APIGatewayProxyCallback
) => {
    let connection;
    let queryResult;
    let companyData = JSON.parse(event.body);
    const sqlQuery = `INSERT INTO company (name, logo_url, website, industry, size, domain, founded) 
                      VALUES (?, ?, ?, ?, ?, ?, ?)`;

    try {
        connection = await getDbConnection();
        queryResult = await queryDb(connection, sqlQuery, [
            companyData.name,
            companyData.logo_url,
            companyData.website,
            companyData.industry || null,
            companyData.size || null,
            companyData.domain,
            companyData.founded || null,
        ]);
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
