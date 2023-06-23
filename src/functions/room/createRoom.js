const { buildResponse } = require("../../utils/buildResponse.js");
const { HttpCodes } = require("../../utils/constants.js");

module.exports.handler = async (event) => {
  const {
    body,
    requestContext: {
      authorizer: { principalId },
    },
  } = event;

  const userId = principalId.split(" ")[0];

  console.log(userId);

  return buildResponse(HttpCodes.SUCCESS, { message: "Success!" });
};
