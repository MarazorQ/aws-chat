const { UpdateCommand } = require("@aws-sdk/lib-dynamodb");

const { buildResponse } = require("../../utils/buildResponse.js");
const { verifyToken } = require("../../utils/jwt.js");
const { dbClient } = require("../../utils/dbClient.js");

const { UserStatus } = require("../../utils/constants.js");

const tableName = process.env.DYNAMO_USERS_TABLE_NAME;

module.exports.handler = async (event) => {
  const { headers, requestContext } = event;
  const { HeaderAuth } = headers;

  const { verified, response } = verifyToken(HeaderAuth);

  if (!verified) return buildResponse(403, { message: "Unauthorized!" });

  const { email } = response;

  await dbClient.send(
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