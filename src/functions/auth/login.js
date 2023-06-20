const {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} = require("@aws-sdk/client-cognito-identity-provider");

const { buildResponse } = require("../../utils/buildResponse.js");
const { HttpCodes } = require("../../utils/constants.js");

module.exports.handler = async (event) => {
  const { body } = event;

  const { email, password } = JSON.parse(body);

  const cognitoIdentityProviderClient = new CognitoIdentityProviderClient({});

  const command = new InitiateAuthCommand({
    ClientId: process.env.COGNITO_CLIENT_ID,
    AuthFlow: "USER_PASSWORD_AUTH",
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
  });

  try {
    const {
      AuthenticationResult: { AccessToken, RefreshToken, IdToken },
    } = await cognitoIdentityProviderClient.send(command);

    return buildResponse(HttpCodes.SUCCESS, { token: AccessToken });
  } catch (_) {
    return buildResponse(HttpCodes.BAD_REQUEST, {
      message: "Invalid password or login!",
    });
  }
};
