const {
  QueryCommand,
  GetCommand,
  UpdateCommand,
} = require("@aws-sdk/lib-dynamodb");
const {
  PostToConnectionCommand,
} = require("@aws-sdk/client-apigatewaymanagementapi");

const { buildResponse } = require("../../utils/buildResponse.js");
const { dbClient } = require("../../utils/dbClient.js");
const { apiGatewayClient } = require("../../utils/apiGatewayClient.js");

const {
  HttpCodes,
  UserStatus,
  WSEvents,
  MessageMaxLength,
  MessageMaxHoursForUpdate,
} = require("../../utils/constants.js");

const chatTableName = process.env.DYNAMO_CHAT_TABLE_NAME;
const usersTableName = process.env.DYNAMO_USERS_TABLE_NAME;

module.exports.handler = async (event) => {
  const {
    requestContext: {
      domainName,
      stage,
      authorizer: { principalId },
    },
    body,
  } = event;

  const {
    data: { messageId, message, roomId },
  } = JSON.parse(body);

  if (!messageId || !roomId || !message)
    return buildResponse(HttpCodes.BAD_REQUEST, {
      message: "Invalid request data!",
    });

  if (!message?.length || message?.length > MessageMaxLength)
    return buildResponse(HttpCodes.BAD_REQUEST, {
      message: "Invalid request data!",
    });

  const userId = principalId.split(" ")[0];

  const getCommand = new GetCommand({
    TableName: chatTableName,
    Key: {
      PK: messageId,
      SK: messageId,
    },
    ProjectionExpression: "userId, message, createdAt",
  });

  const isMessageExist = await dbClient.send(getCommand);

  if (!isMessageExist.Item)
    return buildResponse(HttpCodes.BAD_REQUEST, {
      message: "Message Not Found",
    });

  if (isMessageExist.Item.userId !== userId)
    return buildResponse(HttpCodes.BAD_REQUEST, {
      message: "You are not message author!",
    });

  if (isMessageExist.Item.message === message)
    return buildResponse(HttpCodes.BAD_REQUEST, {
      message: "The same data!",
    });

  //36e5 = 60 * 60 * 1000
  const differenceBetweenTwoDates =
    Math.abs(
      new Date(new Date().toISOString()) -
        new Date(isMessageExist.Item.createdAt)
    ) / 36e5;

  if (differenceBetweenTwoDates >= MessageMaxHoursForUpdate)
    return buildResponse(HttpCodes.BAD_REQUEST, {
      message: "Expire!",
    });

  const updateMessageCommand = new UpdateCommand({
    TableName: chatTableName,
    Key: {
      PK: messageId,
      SK: messageId,
    },
    UpdateExpression: "SET message = :message, isUpdated = :isUpdated",
    ExpressionAttributeValues: {
      ":message": message,
      ":isUpdated": true,
    },
  });

  await dbClient.send(updateMessageCommand);

  const queryCommandByGSI1 = new QueryCommand({
    TableName: chatTableName,
    IndexName: "GSI1",
    KeyConditionExpression:
      "#GSI1PK = :GSI1PK and begins_with(#GSI1SK, :GSI1SK)",
    ExpressionAttributeNames: {
      "#GSI1PK": "GSI1PK",
      "#GSI1SK": "GSI1SK",
    },
    ExpressionAttributeValues: {
      ":GSI1PK": roomId,
      ":GSI1SK": "USER",
    },
  });

  const allUsersFromRoom = await dbClient.send(queryCommandByGSI1);

  if (allUsersFromRoom.Items.length > 1) {
    const connections = [];

    await Promise.all(
      allUsersFromRoom.Items.map(async (item) => {
        if (item.id !== userId) {
          const user = await dbClient.send(
            new GetCommand({
              TableName: usersTableName,
              Key: {
                cognitoId: item.id,
              },
            })
          );

          return connections.push(user.Item);
        }
      })
    );

    if (connections.length) {
      const apiGatewayManagementApiClient = apiGatewayClient(stage, domainName);

      await Promise.all(
        connections.map(async (item) => {
          if (item.status === UserStatus.ONLINE) {
            const messageData = {
              roomId,
              messageId,
              message,
              isUpdated: true,
              event: WSEvents.UPDATE_MESSAGE,
            };

            const postToConnectionCommand = new PostToConnectionCommand({
              ConnectionId: item.connectionId,
              Data: Buffer.from(JSON.stringify(messageData)),
            });
            return apiGatewayManagementApiClient.send(postToConnectionCommand);
          }
        })
      );
    }
  }

  return buildResponse(HttpCodes.SUCCESS, { message: "Success!" });
};
