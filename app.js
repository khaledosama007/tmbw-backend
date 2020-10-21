const path = require('path'); 

require("dotenv").config(({ path: path.join(__dirname, '.env') }));
var express = require("express");
// var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var indexRouter = require("./routes/index");
var apiRouter = require("./routes/api");
var apiResponse = require("./helpers/apiResponse");
var cors = require("cors");
var jwt = require("./middlewares/jwt");
const bodyParser = require("body-parser");
// DB connection
var MONGODB_URL = process.env.MONGODB_URL;
var MONGODB_PROD_URL = process.env.MONGODB_PROD_URL;

var mongoose = require("mongoose");
mongoose
  .connect(process.env.NODE_ENV ==="test"?MONGODB_URL : MONGODB_PROD_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    //don't show the log when it is test
    //if (process.env.NODE_ENV !== "test") {
      console.log("Connected to %s", process.env.NODE_ENV ==="test"?MONGODB_URL : MONGODB_PROD_URL);
      console.log("App is running ... \n");
      console.log("Press CTRL + C to stop the process. \n");
   // }
  })
  .catch((err) => {
    console.error("App starting error:", err.message);
    process.exit(1);
  });
var db = mongoose.connection;

var app = express();

//don't show the log when it is test
if (process.env.NODE_ENV !== "test") {
  app.use(logger("dev"));
}
//app.use(express.json());
//app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.JWT_SECRET));
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/v1/", jwt);
//To allow cross-origin requests
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
//Route Prefixes
app.use("/", indexRouter);
app.use("/api/v1/", apiRouter);

// throw 404 if URL not found
app.all("*", function (req, res) {
  return apiResponse.notFoundResponse(res, "Page not found");
});

app.use((err, req, res) => {
  if (err.name == "UnauthorizedError") {
    return apiResponse.unauthorizedResponse(res, err.message);
  }
});

module.exports = app;
