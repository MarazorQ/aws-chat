const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  UpdateCommand,
  ScanCommand,
} = require("@aws-sdk/lib-dynamodb");

const { buildResponse } = require("./utils/buildResponse.js");
const { UserStatus } = require("./utils/constants.js");

const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);
const tableName = process.env.DYNAMO_USERS_TABLE_NAME;

module.exports.handler = async (event) => {
  const { requestContext } = event;

  const { Items } = await dynamo.send(
    new ScanCommand({
      TableName: tableName,
      FilterExpression: "#DYNOBASE_connectionId = :connectionId",
      ExpressionAttributeNames: {
        "#DYNOBASE_connectionId": "connectionId",
      },
      ExpressionAttributeValues: {
        ":connectionId": requestContext.connectionId,
      },
    })
  );

  await dynamo.send(
    new UpdateCommand({
      TableName: tableName,
      Key: {
        email: Items[0].email,
      },
      UpdateExpression: "SET connectionId = :connectionId, #st = :status",
      ExpressionAttributeValues: {
        ":connectionId": "",
        ":status": UserStatus.OFFLINE,
      },
      ExpressionAttributeNames: {
        "#st": "status",
      },
    })
  );

  return buildResponse(200, { message: "Success!" });
};
