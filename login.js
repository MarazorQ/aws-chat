const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand } = require("@aws-sdk/lib-dynamodb");
const bcrypt = require("bcryptjs");

const { buildResponse } = require("./utils/buildResponse.js");
const { generateToken } = require("./utils/jwt.js");

const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);
const tableName = "AS_USERS";

module.exports.handler = async (event) => {
  const { body } = event;

  const { email, password } = JSON.parse(body);

  const isUserExist = await dynamo.send(
    new GetCommand({
      TableName: tableName,
      Key: {
        email: email,
      },
    })
  );

  if (!isUserExist.Item)
    return buildResponse(400, { message: "Invalid password or login!" });

  const isPasswordValid = await bcrypt.compare(
    password,
    isUserExist.Item?.password
  );

  if (!isPasswordValid)
    return buildResponse(400, { message: "Invalid password or login!" });

  const userInfo = {
    email: isUserExist.Item?.email,
    id: isUserExist.Item?.id,
  };

  const token = generateToken(userInfo);

  return buildResponse(200, { token });
};
