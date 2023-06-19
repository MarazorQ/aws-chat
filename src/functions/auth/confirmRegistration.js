const { PutCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");
const {
  CognitoIdentityProviderClient,
  ConfirmSignUpCommand,
} = require("@aws-sdk/client-cognito-identity-provider");

const { buildResponse } = require("../../utils/buildResponse.js");
const { dbClient } = require("../../utils/dbClient.js");

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

    return buildResponse(200, { message: "Success!" });
  } catch (_) {
    return buildResponse(400, { message: "Invalid activation code!" });
  }
};
