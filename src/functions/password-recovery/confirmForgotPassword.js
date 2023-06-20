const {
  CognitoIdentityProviderClient,
  ConfirmForgotPasswordCommand,
} = require("@aws-sdk/client-cognito-identity-provider");

const { buildResponse } = require("../../utils/buildResponse.js");
const { HttpCodes } = require("../../utils/constants.js");

module.exports.handler = async (event) => {
  const { body } = event;

  const { email, password, confirmationCode } = JSON.parse(body);

  const cognitoIdentityProviderClient = new CognitoIdentityProviderClient({});

  const command = new ConfirmForgotPasswordCommand({
    ClientId: process.env.COGNITO_CLIENT_ID,
    Username: email,
    ConfirmationCode: confirmationCode,
    Password: password,
  });

  try {
    await cognitoIdentityProviderClient.send(command);

    return buildResponse(HttpCodes.SUCCESS, { message: "Success" });
  } catch (_) {
    return buildResponse(HttpCodes.BAD_REQUEST, {
      message: "Invalid request data!",
    });
  }
};
