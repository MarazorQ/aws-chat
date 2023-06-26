const {
  CognitoIdentityProviderClient,
  ForgotPasswordCommand,
} = require("@aws-sdk/client-cognito-identity-provider");

const { buildResponse } = require("../../utils/buildResponse.js");
const { HttpCodes } = require("../../utils/constants.js");

module.exports.handler = async (event) => {
  const { body } = event;

  const { email } = JSON.parse(body);

  const cognitoIdentityProviderClient = new CognitoIdentityProviderClient({});

  const command = new ForgotPasswordCommand({
    ClientId: process.env.COGNITO_CLIENT_ID,
    Username: email,
  });

  try {
    await cognitoIdentityProviderClient.send(command);

    return buildResponse(HttpCodes.SUCCESS, {
      message: "We have sent you a code by email",
    });
  } catch (_) {
    return buildResponse(HttpCodes.BAD_REQUEST, {
      message: "Invalid request data!",
    });
  }
};
