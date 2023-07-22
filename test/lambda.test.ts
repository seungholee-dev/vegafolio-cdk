import { APIGatewayProxyEvent } from "aws-lambda";
import { handler } from "../src/lambda_functions/companies/get-companies";

// Get Company Function
describe('Unitest for getCompany function', () => {
    test('should return 200', async () => {
        const event: APIGatewayProxyEvent = {
          
        };
        const result = await handler(event, null, null);
        expect(result.statusCode).toEqual(200);
    }