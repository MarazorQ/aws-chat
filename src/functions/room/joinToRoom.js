const {
  TransactWriteCommand,
  GetCommand,
  QueryCommand,
} = require("@aws-sdk/lib-dynamodb");
const KSUID = require("ksuid");

const { buildResponse } = require("../../utils/buildResponse.js");
const { HttpCodes, DBKeyPrefix } = require("../../utils/constants.js");
const { dbClient } = require("../../utils/dbClient.js");

const chatTableName = process.env.DYNAMO_CHAT_TABLE_NAME;
const usersTableName = process.env.DYNAMO_USERS_TABLE_NAME;

module.exports.handler = async (event) => {
  const {
    body,
    requestContext: {
      authorizer: { principalId },
    },
  } = event;

  const { name } = JSON.parse(body);

  const getCommand = new GetCommand({
    TableName: chatTableName,
    Key: {
      PK: `ROOM#${name}`,
      SK: "CONFIG",
    },
  });

  const isRoomExist = await dbClient.send(getCommand);

  if (!isRoomExist.Item)
    return buildResponse(HttpCodes.NOT_FOUND, { message: "Room not found!" });

  const { owner, private } = isRoomExist.Item;

  if (private)
    return buildResponse(HttpCodes.BAD_REQUEST, {
      message: "Room is private!",
    });

  const userId = principalId.split(" ")[0];

  if (owner === userId)
    return buildResponse(HttpCodes.BAD_REQUEST, {
      message: "You are already joined",
    });

  const queryCommandByGSI1 = new QueryCommand({
    TableName: chatTableName,
    IndexName: "GSI1",
    KeyConditionExpression: "#GSI1PK = :GSI1PK and #GSI1SK = :GSI1SK",
    ExpressionAttributeNames: {
      "#GSI1PK": "GSI1PK",
      "#GSI1SK": "GSI1SK",
    },
    ExpressionAttributeValues: {
      ":GSI1PK": DBKeyPrefix.ROOM(name),
      ":GSI1SK": DBKeyPrefix.USER(userId),
    },
  });

  const isUserAlreadyJoined = await dbClient.send(queryCommandByGSI1);

  if (isUserAlreadyJoined.Items.length)
    return buildResponse(HttpCodes.BAD_REQUEST, {
      message: "You are already joined",
    });

  // const getUserCommand = new GetCommand({
  //     TableName: chatTableName,
  //     Key: {
  //         cognitoId: userId,
  //     },
  //   });

  const ksuidFromAsync = (await KSUID.random()).string;

  const transactWriteCommand = new TransactWriteCommand({
    TransactItems: [
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
      {
        Put: {
          TableName: chatTableName,
          Item: {
            PK: DBKeyPrefix.MESSAGE(ksuidFromAsync),
            SK: DBKeyPrefix.MESSAGE(ksuidFromAsync),
            GSI1PK: DBKeyPrefix.ROOM(name),
            GSI1SK: DBKeyPrefix.MESSAGE(ksuidFromAsync),
            createdAt: new Date().toISOString(),
            message: "Joined",
            roomId: DBKeyPrefix.ROOM(name),
            type: "joinedMessage",
          },
        },
      },
    ],
  });

  await dbClient.send(transactWriteCommand);

  return buildResponse(HttpCodes.SUCCESS, { message: "Success!" });
};
