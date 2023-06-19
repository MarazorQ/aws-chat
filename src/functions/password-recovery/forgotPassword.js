const {
  CognitoIdentityProviderClient,
  ForgotPasswordCommand,
} = require("@aws-sdk/client-cognito-identity-provider");

const { buildResponse } = require("../../utils/buildResponse.js");

module.exports.handler = async (event) => {
  const { body } = event;

  const { email } = JSON.parse(body);

  const cognitoIdentityProviderClient = new CognitoIdentityProviderClient({});

  const command = new ForgotPasswordCommand({
    ClientId: process.env.COGNITO_CLIENT_ID,
    Username: email,
  });

  try {
    const response = await cognitoIdentityProviderClient.send(command);

    return buildResponse(200, { response });
  } catch (_) {
    return buildResponse(200, { message: "Invalid request data!" });
  }
};
