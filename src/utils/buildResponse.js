module.exports.buildResponse = (statusCode, body, header = {}) => {
  return {
    statusCode: statusCode,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
      ...header,
    },
    body: JSON.stringify(body),
  };
};
