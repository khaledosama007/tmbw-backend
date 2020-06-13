const UserModel = require("../models/UserModel");
//helper file to prepare responses.
const apiResponse = require("../helpers/apiResponse");
const auth = require("../middlewares/jwt");
const fs = require("fs");
const AWS = require("aws-sdk");

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: "eu-central-1",
});
exports.addPicture = [
  auth,
  async function (req, res) {
    let user = await UserModel.find({ _id: req.body.id });
    if (user) {
      let s3options = {
        ACL: "public-read",
        Bucket: process.env.USER_PROFILE_BUCKET,
        Body: fs.createReadStream(req.file.path),
        Key: `${user[0]._id}/${req.file.originalname}`,
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
          UserModel.updateOne({ _id: user[0]._id });
          user[0].profilePic = locationUrl;
          user[0].save().then(
            (user) => {
              return apiResponse.successResponseWithData(
                res,
                "Profile Picture updated Successfully",
                { profilePic: user.profilePic }
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
