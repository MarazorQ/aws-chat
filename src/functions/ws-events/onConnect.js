const { UpdateCommand } = require("@aws-sdk/lib-dynamodb");

const { buildResponse } = require("../../utils/buildResponse.js");
const { verifyToken } = require("../../utils/jwt.js");
const { dbClient } = require("../../utils/dbClient.js");

const { UserStatus, HttpCodes } = require("../../utils/constants.js");

const tableName = process.env.DYNAMO_USERS_TABLE_NAME;

module.exports.handler = async (event) => {
  const { headers, requestContext } = event;
  const { HeaderAuth } = headers;

  const { verified, response } = await verifyToken(HeaderAuth);

  if (!verified)
    return buildResponse(HttpCodes.UNAUTHORIZED, { message: "Unauthorized!" });

  const { username } = response;

  await dbClient.send(
    new UpdateCommand({
      TableName: tableName,
      Key: {
        cognitoId: username,
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

  return buildResponse(HttpCodes.SUCCESS, { message: "Success!" });
};
