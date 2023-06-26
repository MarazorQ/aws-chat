exports.UserStatus = {
  ONLINE: "ONLINE",
  OFFLINE: "OFFLINE",
};

exports.HttpCodes = {
  SUCCESS: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 403,
  NOT_FOUND: 404,
};

exports.Effects = {
  ALLOW: "Allow",
  DENY: "Deny",
};

exports.DBKeyPrefix = {
  ROOM: (item) => `ROOM#${item}`,
  CONFIG: "CONFIG",
  USER: (item) => `USER#${item}`,
  MESSAGE: (item) => `MESSAGE#${item}`,
};
