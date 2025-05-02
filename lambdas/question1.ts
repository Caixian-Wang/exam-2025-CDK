import { APIGatewayProxyHandlerV2 } from "aws-lambda";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

const client = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    console.log("Event: ", JSON.stringify(event));

    // 检查是否是 GET 请求
    if (event.requestContext.http.method !== "GET") {
      return {
        statusCode: 405,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ error: "Method not allowed" }),
      };
    }

    // 获取路径参数和查询参数
    const movieId = event.pathParameters?.movieId;
    const role = event.queryStringParameters?.role;

    // 验证参数
    if (!movieId || !role) {
      return {
        statusCode: 400,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ error: "Missing required parameters" }),
      };
    }

    // 从 DynamoDB 获取数据
    const command = new GetCommand({
      TableName: process.env.TABLE_NAME,
      Key: {
        movieId: parseInt(movieId),
        role: role,
      },
    });

    const response = await client.send(command);

    if (!response.Item) {
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ error: "No crew member found" }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(response.Item),
    };
  } catch (error: any) {
    console.log(JSON.stringify(error));
    return {
      statusCode: 500,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ error: error.message }),
    };
  }
};

function createDDbDocClient() {
  const ddbClient = new DynamoDBClient({ region: process.env.REGION });
  const marshallOptions = {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  };
  const unmarshallOptions = {
    wrapNumbers: false,
  };
  const translateConfig = { marshallOptions, unmarshallOptions };
  return DynamoDBDocumentClient.from(ddbClient, translateConfig);
}
