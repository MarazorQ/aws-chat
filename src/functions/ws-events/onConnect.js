const { UpdateCommand } = require("@aws-sdk/lib-dynamodb");

const { buildResponse } = require("../../utils/buildResponse.js");
const { dbClient } = require("../../utils/dbClient.js");

const { UserStatus, HttpCodes } = require("../../utils/constants.js");

const tableName = process.env.DYNAMO_USERS_TABLE_NAME;

module.exports.handler = async (event) => {
  const {
    requestContext: {
      authorizer: { principalId },
      connectionId,
    },
  } = event;

  const userId = principalId.split(" ")[0];

  await dbClient.send(
    new UpdateCommand({
      TableName: tableName,
      Key: {
        cognitoId: userId,
      },
      UpdateExpression: "SET connectionId = :connectionId, #st = :status",
      ExpressionAttributeValues: {
        ":connectionId": connectionId,
        ":status": UserStatus.ONLINE,
      },
      ExpressionAttributeNames: {
        "#st": "status",
      },
    })
  );

  return buildResponse(HttpCodes.SUCCESS, { message: "Success!" });
};
