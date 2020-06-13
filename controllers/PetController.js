const PetModel = require("../models/PetModel");
const UserModel = require("../models/UserModel");
const apiResponse = require("../helpers/apiResponse");
const auth = require("../middlewares/jwt");
const fs = require("fs");
const { check, body, validationResult } = require("express-validator");
const AWS = require("aws-sdk");
const ObjectID = require("mongodb").ObjectID;

AWS.config.setPromisesDependency(require("bluebird"));
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: "eu-central-1",
});

exports.addPet = [
  auth,
  body("name", "Name is required.").isLength({ min: 1 }),
  body("age", "Age is required").isNumeric(),
  check("gender", "Gender is required")
    .matches("[MF]+")
    .isLength({ min: 1, max: 1 }),
  body("category", "You must choose a category Id")
    .isNumeric()
    .isLength({ min: 1 }),
  body("subcategory", "You must select a subcategory Id")
    .isNumeric()
    .isLength({ min: 1 }),
  body("price").isNumeric(),
  body("address").isString(),
  body("owner", "A pet must have at least one owner").custom(
    async (value, { req }) => {
      let pet = await PetModel.find({
        name: req.body.name,
        owner: value,
      }).exec();
      if (pet.length) {
        console.log("foundUser" + pet);
        if (pet) return Promise.reject("You can't add two pets with same name");
      } else {
      }
    }
  ),
  async (req, res) => {
    try {
      let errors = validationResult(req);
      if (!errors.isEmpty()) {
        return apiResponse.validationErrorWithData(
          res,
          "Validation Error.",
          errors.array()
        );
      } else {
        let imagesArr = [];
        let user = await UserModel.findById(req.body.owner);
        if (user) {
          if (req.files) {
            let promises = [];
            req.files.forEach((file) => {
              let s3options = {
                ACL: "public-read",
                Bucket: process.env.USER_PETS_IMAGES_BUCKET,
                Body: fs.createReadStream(file.path),
                Key: `${user._id}/${req.body.name}/${file.originalname}`,
              };
              let uploadPromise = s3.upload(s3options).promise();
              promises.push(uploadPromise);
            });
            Promise.all(promises).then(
              (arr) => {
                arr.forEach((data, index) => {
                  //fs.unlinkSync(file.path);
                  imagesArr.push(data.Location);
                });
                let newPet = new PetModel({
                  name: req.body.name,
                  age: req.body.age,
                  gender: req.body.gender,
                  category: req.body.category,
                  subcategory: req.body.subcategory,
                  price: req.body.price,
                  address: req.body.address,
                  pics: imagesArr,
                  owner: req.body.owner,
                  belongToAd: false,
                });
                newPet.save(function (err, pet) {
                  if (err) return apiResponse.ErrorResponse(res, err);
                  let returnData = {
                    id: newPet._id,
                    name: newPet.name,
                    age: newPet.age,
                    gender: newPet.gender,
                    category: newPet.category,
                    subcategory: newPet.subcategory,
                    price: newPet.price,
                    address: newPet.address,
                    pics: newPet.pics,
                    owner: newPet.owner,
                    belongToAd: false,
                  };
                  return apiResponse.successResponseWithData(
                    res,
                    "Pet Added Sucessfully",
                    returnData
                  );
                });
              },
              (err) => {
                return apiResponse.ErrorResponse(
                  res,
                  "Failed to upload Image , try again"
                );
              }
            );
          }
        } else {
          return apiResponse.ErrorResponse(res, "Error : user not found.");
        }
      }
    } catch (err) {
      console.log(err);
      return apiResponse.ErrorResponse(res, err);
    }
  },
];

exports.deletePet = [
  auth,
  async (req, res) => {
    try {
      /* let error = validationResult(req);
      console.log(error);
      if (!error.isEmpty()) {
        return apiResponse.validationErrorWithData(
          res,
          "Valdiation Error",
          error.array()
        );
      } */
      if (!ObjectID.isValid(req.params.id)) {
        return apiResponse.ErrorResponse(res, "Pet id is not valid");
      }

      let pet = PetModel.findByIdAndDelete(new ObjectID(req.params.id)).exec();
      if (pet) {
        return apiResponse.successResponse(res, "Pet Deleted Successfully");
      }
    } catch (err) {
      console.log(err);
      return apiResponse.ErrorResponse(res, err);
    }
  },
];

exports.getById = [
  auth,
  async (req, res) => {
    try {
      if (!ObjectID.isValid(req.params.id)) {
        return apiResponse.ErrorResponse(res, "Pet id is not valid");
      }
      let pet = await PetModel.findById(new ObjectID(req.params.id)).exec();
      if (pet) {
        return apiResponse.successResponseWithData(res, "Pet found", pet);
      }
    } catch (err) {
      return apiResponse.ErrorResponse(res, "Failed to get pet");
    }
  },
];

exports.getUserPets = [
  auth,
  (req, res) => {
    if (!ObjectID.isValid(req.params.userid)) {
      return apiResponse.ErrorResponse(res, "user id is not valid");
    } else {
      PetModel.find({ owner: new ObjectID(req.params.userid) }, (err, pets) => {
        console.log(err);
        if (err) {
          return apiResponse.ErrorResponse(res, err);
        } else if (!pets.length) {
          return apiResponse.ErrorResponse(
            res,
            "Can't find pets with this user"
          );
        } else {
          return apiResponse.successResponseWithData(
            res,
            "User Pet found",
            pets
          );
        }
      });
    }
  },
];
