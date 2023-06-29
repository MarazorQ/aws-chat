const {
  QueryCommand,
  GetCommand,
  TransactWriteCommand,
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
  MessageMaxCountForRead,
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
    data: { messageIds, roomId },
  } = JSON.parse(body);

  if (!messageIds || !roomId)
    return buildResponse(HttpCodes.BAD_REQUEST, {
      message: "Invalid request data!",
    });

  if (!messageIds?.length || messageIds?.length > MessageMaxCountForRead)
    return buildResponse(HttpCodes.BAD_REQUEST, {
      message: "Invalid request data!",
    });

  const userId = principalId.split(" ")[0];

  const updateMessageCommands = messageIds.map((messageId) => ({
    Update: {
      TableName: chatTableName,
      Key: {
        PK: messageId,
        SK: messageId,
      },
      UpdateExpression: "SET isRead = :isRead",
      ExpressionAttributeValues: {
        ":isRead": true,
      },
    },
  }));

  const transactWriteCommand = new TransactWriteCommand({
    TransactItems: updateMessageCommands,
  });

  await dbClient.send(transactWriteCommand);

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
              messageIds,
              event: WSEvents.READ_MESSAGE,
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
