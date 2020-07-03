const jwt = require("express-jwt");
const secret = process.env.JWT_SECRET;

const authenticate = jwt({
  secret: secret,
  algorithms: ["RS256"],
  credentialsRequired: false,
}).unless({ path: ["api/v1/auth/register/", "api/v1/auth/login/"] });

module.exports = authenticate;
