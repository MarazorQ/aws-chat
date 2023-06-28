const {
  QueryCommand,
  GetCommand,
  PutCommand,
} = require("@aws-sdk/lib-dynamodb");
const {
  PostToConnectionCommand,
} = require("@aws-sdk/client-apigatewaymanagementapi");
const KSUID = require("ksuid");

const { buildResponse } = require("../../utils/buildResponse.js");
const { dbClient } = require("../../utils/dbClient.js");
const { apiGatewayClient } = require("../../utils/apiGatewayClient.js");

const {
  HttpCodes,
  DBKeyPrefix,
  UserStatus,
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
    data: { message, roomId },
  } = JSON.parse(body);

  const userId = principalId.split(" ")[0];

  const ksuidFromAsync = (await KSUID.random()).string;

  const putMessageCommand = new PutCommand({
    TableName: chatTableName,
    Item: {
      PK: DBKeyPrefix.MESSAGE(ksuidFromAsync),
      SK: DBKeyPrefix.MESSAGE(ksuidFromAsync),
      GSI1PK: roomId,
      GSI1SK: DBKeyPrefix.MESSAGE(ksuidFromAsync),
      createdAt: new Date().toISOString(),
      message: message,
      roomId,
      userId,
      isRead: false,
      type: "message",
    },
  });

  await dbClient.send(putMessageCommand);

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
            const messageData = { roomId, message, userId, isRead: false };

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
