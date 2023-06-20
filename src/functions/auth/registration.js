const {
  CognitoIdentityProviderClient,
  SignUpCommand,
} = require("@aws-sdk/client-cognito-identity-provider");

const { buildResponse } = require("../../utils/buildResponse.js");
const { HttpCodes } = require("../../utils/constants.js");

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

    return buildResponse(HttpCodes.SUCCESS, {
      message: "Success!",
      userId: UserSub,
    });
  } catch (_) {
    return buildResponse(HttpCodes.BAD_REQUEST, {
      message: "User already exists!",
    });
  }
};
