const {
  ApiGatewayManagementApiClient,
} = require("@aws-sdk/client-apigatewaymanagementapi");
const util = require("util");

const { ApiGatewayVersion } = require("./constants.js");

module.exports.apiGatewayClient = (stage, domainName) => {
  const endpoint = util.format(util.format("https://%s/%s", domainName, stage));
  const apiGatewayManagementApiClient = new ApiGatewayManagementApiClient({
    apiVersion: ApiGatewayVersion,
    endpoint,
  });

  return apiGatewayManagementApiClient;
};
