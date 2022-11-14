import { Context, APIGatewayProxyCallback, APIGatewayEvent } from "aws-lambda";

export const handler  = async (
    event: APIGatewayEvent,
    context: Context,
    callback: APIGatewayProxyCallback
) => {
    return {
        body: JSON.stringify({ message: "SUCCESS 🎉" }),
        statusCode: 200,
    };
};