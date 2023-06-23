const { verifyToken } = require("../../utils/jwt.js");
const { Effects } = require("../../utils/constants.js");

const generatePolicy = (effect, resource) => ({
  Version: "2012-10-17",
  Statement: [
    {
      Action: "execute-api:Invoke",
      Effect: effect,
      Resource: resource,
    },
  ],
});

module.exports.handler = async (event, context, callback) => {
  const { queryStringParameters, authorizationToken, methodArn } = event;

  const token = authorizationToken.split(" ")[1];

  if (!token) callback("Unauthorized");

  const { verified, response } = await verifyToken(token);

  if (!verified) callback("Unauthorized");

  const policy = generatePolicy(Effects.ALLOW, methodArn);

  const { username, exp, sub } = response;

  return callback(null, {
    principalId: `${sub} ${username} ${exp}`,
    policyDocument: policy,
  });
};
