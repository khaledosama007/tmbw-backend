const PetModel = require("../models/PetModel");
const UserModel = require("../models/UserModel");
//helper file to prepare responses.
const apiResponse = require("../helpers/apiResponse");
const auth = require("../middlewares/jwt");
const fs = require("fs");
const AWS = require("aws-sdk");
const { check, body, validationResult } = require("express-validator");

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: "eu-central-1",
});
exports.addPicture = [
  auth,
  async function (req, res) {
    let user = await UserModel.findOne({ _id: req.body.id }).exec();
    if (user) {
      let s3options = {
        ACL: "public-read",
        Bucket: process.env.USER_PROFILE_BUCKET,
        Body: fs.createReadStream(req.file.path),
        Key: `${user._id}/${req.file.originalname}`,
      };
      s3.upload(s3options, (error, data) => {
        if (error) {
          return apiResponse.ErrorResponse(
            res,
            "Failed to upload Image , try again"
          );
        }
        if (data) {
          fs.unlinkSync(req.file.path);
          const locationUrl = data.Location;
          UserModel.updateOne({ _id: user._id });
          user.profilePic = locationUrl;
          user.save().then(
            (user) => {
              return apiResponse.successResponse(
                res,
                "Profile Picture updated Successfully"
              );
            },
            (err) => {
              console.log(err);
            }
          );
        }
      });
    } else {
      return apiResponse.unauthorizedResponse(res, "User Not Found");
    }
  },
];

exports.updateMobileNumber = [
  auth,
  body("userId", "UserId is required").isMongoId(),
  body("mobile", "Mobile number is required").isMobilePhone("ar-EG"),
  async function (req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return apiResponse.validationErrorWithData(
        res,
        "Validation Error.",
        errors.array()
      );
    }
    try {
      const user = await UserModel.findById(req.body.userId).exec();
      user.phoneNumber = req.body.mobile;
      await user.save();
      return apiResponse.successResponse(
        res,
        "Mobile number updated successfully"
      );
    } catch (e) {
      return apiResponse.ErrorResponse(res, "Failed to update mobile number");
    }
  },
];

exports.getProfile = [
  auth,
  async function (req, res) {
    let user = await UserModel.find({ _id: req.params.id })
      .populate("pets")
      .exec();
    if (user) {
      return apiResponse.successResponseWithData(
        res,
        "User profile found",
        user
      );
    } else return apiResponse.ErrorResponse(res, "failed to get user");
  },
];
