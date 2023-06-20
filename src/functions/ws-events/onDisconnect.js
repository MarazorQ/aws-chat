const { UpdateCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");

const { buildResponse } = require("../../utils/buildResponse.js");
const { dbClient } = require("../../utils/dbClient.js");

const { UserStatus, HttpCodes } = require("../../utils/constants.js");

const tableName = process.env.DYNAMO_USERS_TABLE_NAME;

module.exports.handler = async (event) => {
  const { requestContext } = event;

  const { Items } = await dbClient.send(
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

  await dbClient.send(
    new UpdateCommand({
      TableName: tableName,
      Key: {
        cognitoId: Items[0].cognitoId,
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

  return buildResponse(HttpCodes.SUCCESS, { message: "Success!" });
};
