var express = require("express");
var authRouter = require("./auth");
var bookRouter = require("./book");
var userRouter = require("./user");
var petRouter = require("./pet");
var adRouter = require("./ad");
var app = express();

app.use("/auth/", authRouter);
app.use("/user/", userRouter);
app.use("/pet/", petRouter);
app.use("/ad/", adRouter);
module.exports = app;
