const { TransactWriteCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");

const { buildResponse } = require("../../utils/buildResponse.js");
const { HttpCodes, DBKeyPrefix } = require("../../utils/constants.js");
const { dbClient } = require("../../utils/dbClient.js");

const chatTableName = process.env.DYNAMO_CHAT_TABLE_NAME;

module.exports.handler = async (event) => {
  const {
    body,
    requestContext: {
      authorizer: { principalId },
    },
  } = event;

  const { name, private, icon } = JSON.parse(body);

  const getCommand = new GetCommand({
    TableName: chatTableName,
    Key: {
      PK: DBKeyPrefix.ROOM(name),
      SK: DBKeyPrefix.CONFIG,
    },
  });

  const isRoomAlreadyExist = await dbClient.send(getCommand);

  if (isRoomAlreadyExist.Item)
    return buildResponse(HttpCodes.BAD_REQUEST, {
      message: "Room already exists!",
    });

  const userId = principalId.split(" ")[0];

  const transactWriteCommand = new TransactWriteCommand({
    TransactItems: [
      {
        Put: {
          TableName: chatTableName,
          Item: {
            PK: DBKeyPrefix.ROOM(name),
            SK: DBKeyPrefix.CONFIG,
            owner: userId,
            type: "room",
            name,
            icon,
            private,
          },
        },
      },
      {
        Put: {
          TableName: chatTableName,
          Item: {
            PK: DBKeyPrefix.USER(userId),
            SK: DBKeyPrefix.ROOM(name),
            GSI1PK: DBKeyPrefix.ROOM(name),
            GSI1SK: DBKeyPrefix.USER(userId),
            type: "user",
          },
        },
      },
    ],
  });

  await dbClient.send(transactWriteCommand);

  return buildResponse(HttpCodes.CREATED, { message: "Success!" });
};
