const { GetCommand } = require("@aws-sdk/lib-dynamodb");
const bcrypt = require("bcryptjs");

const { buildResponse } = require("./utils/buildResponse.js");
const { generateToken } = require("./utils/jwt.js");
const { dbClient } = require("./utils/dbClient.js");

const tableName = process.env.DYNAMO_USERS_TABLE_NAME;

module.exports.handler = async (event) => {
  const { body } = event;

  const { email, password } = JSON.parse(body);

  const isUserExist = await dbClient.send(
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
