var express = require("express");
var authRouter = require("./auth");
var userRouter = require("./user");
var petRouter = require("./pet");
var adRouter = require("./ad");
var importData = require("./../rawdata/import-data");
var app = express();
app.use("/auth/", authRouter);
app.use("/user/", userRouter);
app.use("/pet/", petRouter);
app.use("/ad/", adRouter);
app.get("/impoer-data" ,importData.importData )
module.exports = app;
