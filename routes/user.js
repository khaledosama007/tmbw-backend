var express = require("express");
const multer = require("multer");
const UserController = require("../controllers/UserController");

var router = express.Router();

router.post(
  "/add-picture",
  multer({ dest: "temp/", limits: { fieldSize: 8 * 1024 * 1024 } }).single(
    "profilePiture"
  ),
  UserController.addPicture
);
router.post("/update-mobile", UserController.updateMobileNumber);
router.get("/user-profile/:id", UserController.getProfile);
module.exports = router;
