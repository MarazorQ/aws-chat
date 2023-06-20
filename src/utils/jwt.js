const { CognitoJwtVerifier } = require("aws-jwt-verify");

module.exports.verifyToken = async (token) => {
  const verifier = CognitoJwtVerifier.create({
    userPoolId: process.env.COGNITO_USERS_POOL_ID,
    tokenUse: "access",
    clientId: process.env.COGNITO_CLIENT_ID,
  });

  try {
    const response = await verifier.verify(token);

    return {
      verified: true,
      response,
    };
  } catch (_) {
    return {
      verified: false,
      response: null,
    };
  }
};
