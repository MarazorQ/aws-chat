const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  UpdateCommand,
} = require("@aws-sdk/lib-dynamodb");

const { buildResponse } = require("./utils/buildResponse.js");
const { verifyToken } = require("./utils/jwt.js");
const { UserStatus } = require("./utils/constants.js");

const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);
const tableName = "AS_USERS";

module.exports.handler = async (event) => {
  const { headers, requestContext } = event;
  const { HeaderAuth } = headers;

  const { verified, response } = verifyToken(HeaderAuth);

  if (!verified) return buildResponse(403, { message: "Unauthorized!" });

  const { email } = response;

  await dynamo.send(
    new UpdateCommand({
      TableName: tableName,
      Key: {
        email,
      },
      UpdateExpression: "SET connectionId = :connectionId, #st = :status",
      ExpressionAttributeValues: {
        ":connectionId": requestContext.connectionId,
        ":status": UserStatus.ONLINE,
      },
      ExpressionAttributeNames: {
        "#st": "status",
      },
    })
  );

  return buildResponse(200, { message: "Success!" });
};
