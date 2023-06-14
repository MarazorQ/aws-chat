const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

const configuration =
  process.env.IS_OFFLINE === "true"
    ? {
        region: "localhost",
        endpoint: `http://localhost:5000`,
      }
    : {};

const client = new DynamoDBClient(configuration);

module.exports.dbClient = DynamoDBDocumentClient.from(client);
