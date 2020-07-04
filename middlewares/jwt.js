const jwt = require("express-jwt");
const secret = process.env.JWT_SECRET;

const authenticate = jwt({
  secret: secret,
  algorithms: ["HS256"],
  credentialsRequired: false,
}).unless({
  path: ["api/v1/auth/register/", "api/v1/auth/login/", "api/v1/impoer-data"],
});

module.exports = authenticate;
