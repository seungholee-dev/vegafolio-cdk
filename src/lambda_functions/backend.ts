import { Context, APIGatewayProxyCallback, APIGatewayEvent } from "aws-lambda";

export const handler = async (
    event: APIGatewayEvent,
    context: Context,
    callback: APIGatewayProxyCallback
) => {
    if (event.httpMethod == "GET") {
        return {
            body: "Hello There!",
            statusCode: 200,
        };
    }
};
