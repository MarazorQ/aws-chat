const { PutCommand } = require("@aws-sdk/lib-dynamodb");
const {
  CognitoIdentityProviderClient,
  ConfirmSignUpCommand,
} = require("@aws-sdk/client-cognito-identity-provider");

const { buildResponse } = require("../../utils/buildResponse.js");
const { dbClient } = require("../../utils/dbClient.js");
const { UserStatus, HttpCodes } = require("../../utils/constants.js");

const tableName = process.env.DYNAMO_USERS_TABLE_NAME;

module.exports.handler = async (event) => {
  const { body } = event;

  const { activationCode, userId } = JSON.parse(body);

  const cognitoIdentityProviderClient = new CognitoIdentityProviderClient({});

  const command = new ConfirmSignUpCommand({
    ClientId: process.env.COGNITO_CLIENT_ID,
    Username: userId,
    ConfirmationCode: activationCode,
  });

  try {
    await cognitoIdentityProviderClient.send(command);

    await dbClient.send(
      new PutCommand({
        TableName: tableName,
        Item: {
          cognitoId: userId,
          connectionId: "",
          status: UserStatus.OFFLINE,
        },
      })
    );

    return buildResponse(HttpCodes.SUCCESS, { message: "Success!" });
  } catch (_) {
    return buildResponse(HttpCodes.BAD_REQUEST, {
      message: "Invalid activation code!",
    });
  }
};
