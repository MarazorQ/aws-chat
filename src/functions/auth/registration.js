const {
  CognitoIdentityProviderClient,
  SignUpCommand,
} = require("@aws-sdk/client-cognito-identity-provider");

const { buildResponse } = require("../../utils/buildResponse.js");

module.exports.handler = async (event) => {
  const { body } = event;

  const { email, password } = JSON.parse(body);

  const cognitoIdentityProviderClient = new CognitoIdentityProviderClient({});

  const command = new SignUpCommand({
    ClientId: process.env.COGNITO_CLIENT_ID,
    Username: email,
    Password: password,
  });

  try {
    const { UserSub } = await cognitoIdentityProviderClient.send(command);

    return buildResponse(200, { message: "Success!", userId: UserSub });
  } catch (_) {
    return buildResponse(400, { message: "User already exists!" });
  }
};
