const { PutCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

const { buildResponse } = require("../utils/buildResponse.js");
const { dbClient } = require("../utils/dbClient.js");

const tableName = process.env.DYNAMO_USERS_TABLE_NAME;

module.exports.handler = async (event) => {
  const { body } = event;

  const { email, password } = JSON.parse(body);

  const isEmailAlreadyExist = await dbClient.send(
    new GetCommand({
      TableName: tableName,
      Key: {
        email: email,
      },
    })
  );

  if (isEmailAlreadyExist.Item)
    return buildResponse(400, { message: "User already exists!" });

  const passwordSalt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, passwordSalt);

  await dbClient.send(
    new PutCommand({
      TableName: tableName,
      Item: {
        id: uuidv4(),
        email: email,
        password: passwordHash,
      },
    })
  );

  return buildResponse(200, { message: "Success!" });
};
