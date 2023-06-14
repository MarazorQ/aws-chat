const jwt = require("jsonwebtoken");

exports.generateToken = (userInfo) => {
  if (!userInfo) {
    return null;
  }

  return jwt.sign(userInfo, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
};

exports.verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET, (error, response) => {
    if (error)
      return {
        verified: false,
        response: null,
      };

    return {
      verified: true,
      response,
    };
  });
};
