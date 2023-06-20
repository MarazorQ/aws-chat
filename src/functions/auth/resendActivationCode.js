const {
  CognitoIdentityProviderClient,
  ResendConfirmationCodeCommand,
  AdminGetUserCommand,
} = require("@aws-sdk/client-cognito-identity-provider");

const { buildResponse } = require("../../utils/buildResponse.js");
const { HttpCodes } = require("../../utils/constants.js");

module.exports.handler = async (event) => {
  const {
    pathParameters: { userId },
  } = event;

  const cognitoIdentityProviderClient = new CognitoIdentityProviderClient({});

  const resendCodeCommand = new ResendConfirmationCodeCommand({
    ClientId: process.env.COGNITO_CLIENT_ID,
    Username: userId,
  });

  const getUserCommand = new AdminGetUserCommand({
    UserPoolId: process.env.COGNITO_USERS_POOL_ID,
    Username: userId,
  });

  try {
    const { UserStatus } = await cognitoIdentityProviderClient.send(
      getUserCommand
    );

    if (UserStatus === "CONFIRMED") throw new Error("");

    await cognitoIdentityProviderClient.send(resendCodeCommand);

    return buildResponse(HttpCodes.SUCCESS, { message: "Success!" });
  } catch (_) {
    return buildResponse(HttpCodes.BAD_REQUEST, {
      message: "Invalid request data!",
    });
  }
};
