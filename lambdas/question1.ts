import { APIGatewayProxyHandlerV2 } from "aws-lambda";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    console.log("Event: ", JSON.stringify(event));

    // 获取路径参数和查询参数
    const movieId = event.pathParameters?.movieId;
    const role = event.queryStringParameters?.role;

    // 验证必要参数
    if (!movieId) {
      return {
        statusCode: 400,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ error: "Missing movieId parameter" }),
      };
    }

    // 如果提供了 role 参数，查询特定角色
    if (role) {
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
    } 
    // 如果没有提供 role 参数，查询所有角色
    else {
      const command = new QueryCommand({
        TableName: process.env.TABLE_NAME,
        KeyConditionExpression: "movieId = :movieId",
        ExpressionAttributeValues: {
          ":movieId": parseInt(movieId),
        },
      });

      const response = await client.send(command);

      if (!response.Items || response.Items.length === 0) {
        return {
          statusCode: 404,
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ error: "No crew members found for this movie" }),
        };
      }

      return {
        statusCode: 200,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          movieId: parseInt(movieId),
          crew: response.Items,
        }),
      };
    }
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
