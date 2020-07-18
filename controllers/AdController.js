const PetModel = require("../models/PetModel");
const UserModel = require("../models/UserModel");
const AdModel = require("../models/AdModel");
const ApiFeatures = require("../helpers/apiFeatures");
const apiResponse = require("../helpers/apiResponse");
const auth = require("../middlewares/jwt");
const fs = require("fs");
const { check, body, validationResult } = require("express-validator");
const AWS = require("aws-sdk");
const { type } = require("os");
const ObjectID = require("mongodb").ObjectID;
const Joi = require("joi");

const validateAddAd = Joi.object().keys({
  name: Joi.string().required().error(new Error("Name is required")),
  age: Joi.number().required(),
  category: Joi.number().required(),
  subcategory: Joi.number().required(),
  gender: Joi.string().length(1).required(),
  price: Joi.number().required(),
  address: Joi.string().required(),
  phoneNumber: Joi.string(),
  purpose: Joi.string(),
  userid: Joi.string().length(24),
});

const validateAddAddWithPet = Joi.object().keys({
  price: Joi.number().required(),
  address: Joi.string().required(),
  phoneNumber: Joi.string(),
  purpose: Joi.string(),
  userid: Joi.string().length(24),
  petid: Joi.string().length(24),
});
AWS.config.setPromisesDependency(require("bluebird"));
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: "eu-central-1",
});

exports.addAd = [
  auth,
  // body("name", "Name is required.").isLength({ min: 1 }),
  // body("age", "Age is required").isNumeric(),
  // body("category", "You must choose a category Id")
  //   .isNumeric()
  //   .isLength({ min: 1 }),
  // check("gender", "Geder error check").matches("[MF]+"),
  // body("subcategory", "You must select a subcategory Id")
  //   .isNumeric()
  //   .isLength({ min: 1 }),
  // body("price").isNumeric(),
  // body("address").isString(),
  // body("phoneNumber").isMobilePhone("ar-EG"),
  // body("purpose").isString(),
  // check("userid")
  //   .isLength({ min: 1 })
  //   .custom((val) => {
  //     return UserModel.findById(new ObjectID(val), (err, user) => {
  //       if (err) return Promise.reject("user not found");
  //     });
  //   }),
  async (req, res) => {
    try {
      const { error, value } = validateAddAd.validate(req.body);
      if (error) {
        console.log(error);
        return apiResponse.validationErrorWithData(
          res,
          "Validation Error",
          error
        );
      }
      let imagesArr = [];
      let user = await UserModel.findById(req.body.userid).exec();
      if (user) {
        console.log(user);
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
          let arr = await Promise.all(promises);
          if (arr) {
            arr.forEach((data, index) => {
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
              owner: req.body.userid,
              belongToAd: true,
            });
            newPet.save(function (err, pet) {
              if (err) return apiResponse.ErrorResponse(res, err);
              let newAd = new AdModel({
                petId: pet._id,
                price: pet.price,
                address: pet.address,
                phoneNumber: req.body.phoneNumber,
                purpose: req.body.purpose,
                verified: false,
                userId: req.body.userid,
              });
              newAd.save(function (err, ad) {
                if (err) {
                  console.log("errorInNewAdSaeve " + err);
                  return apiResponse.ErrorResponse(res, err);
                } else return apiResponse.successResponseWithData(res, "Ad Added Successfully", ad);
              });
            });
          }

          // });
        }
      }
    } catch (err) {}
  },
];

exports.addAdWithMyPet = [
  auth,
  // body("price", "Price should be provided").isNumeric(),
  // body("address").isString(),
  // body("phoneNumber").isMobilePhone("ar-EG"),
  // body("purpose").isString(),
  // check("userid")
  //   .isLength({ min: 1 })
  //   .custom(async (val) => {
  //     let user = await UserModel.findById(new ObjectID(val)).exec();
  //     if (!user) return Promise.reject("user not found");
  //   }),
  // body("petid")
  //   .isLength({ min: 1 })
  //   .custom(async (petid) => {
  //     let pet = await PetModel.findById(new ObjectID(petid)).exec();
  //     if (!pet) return Promise.reject("Pet id not found");
  //   }),
  async (req, res) => {
    console.log(req.body);
    let { errors } = validateAddAddWithPet.validate(req.body);
    if (errors) {
      return apiResponse.validationErrorWithData(
        res,
        "Validation Error",
        errors
      );
    }
    PetModel.findByIdAndUpdate(
      { _id: new ObjectID(req.body.petid) },
      { belongToAd: true },
      (err, pet) => {
        if (err) {
          return apiResponse.ErrorResponse(res, "Pet not found");
        }
      }
    );
    console.log("Pet Updated");
    let newAd = new AdModel({
      petId: req.body.petid,
      price: req.body.price,
      address: req.body.address,
      phoneNumber: req.body.phoneNumber,
      purpose: req.body.purpose,
      verified: false,
      userId: req.body.userid,
    });
    try {
      let ad = await newAd.save();
      let finalAd = await ad.populate("petId").execPopulate();
      return apiResponse.successResponseWithData(
        res,
        "Ad posted successfully",
        finalAd
      );
    } catch (err) {
      return apiResponse.ErrorResponse(res, "Error happende try again later");
    }
  },
];

exports.deleteAd = [
  auth,
  async (req, res) => {
    if (!ObjectID.isValid(req.params.id)) {
      return apiResponse.ErrorResponse(res, "Ad id is not valid");
    }
    try {
      let ad = await AdModel.findById(new ObjectID(req.params.id)).exec();
      if (ad) {
        if (ad) {
          PetModel.findById(ad.petId).then(
            (pet) => {
              if (pet && pet.belongToAd) {
                PetModel.deleteOne({ _id: pet._id }).then();
              }
            },
            (err) => {}
          );
          AdModel.deleteOne({ _id: req.params.id }).then((val) => {
            return apiResponse.successResponse(res, "Ad deleted Successfully");
          });
        } else {
          return apiResponse.ErrorResponse(res, "can't find ad with this Id");
        }
      }
    } catch (e) {
      return apiResponse.ErrorResponse(res, "can't find ad with this Id");
    }
  },
];

exports.search = [
  auth,
  async (req, res) => {
    try {
      let result = [];
      let query = AdModel.find({});
      let ads = await new ApiFeatures(query, req.query)
        .sort()
        .filter()
        .paginate()
        .query.populate("petId")
        .exec();
      console.log(req.query);
      if (ads.length !== 0) {
        if (req.query.category) {
          ads = ads.filter((ad) => {
            return ad.petId.category === parseInt(req.query.category, 10);
          });
        }
        if (req.query.gender) {
          ads = ads.filter((ad) => {
            return ad.petId.gender == req.query.gender;
          });
        }
        if (req.query.name) {
          console.log(req.query.name);
          ads = ads.filter((ad) => {
            return ad.petId.name == req.query.name;
          });
        }

        if (ads.length === 0)
          return apiResponse.ErrorResponse(res, "failed to get ads");
        else return apiResponse.successResponseWithData(res, "Ad Found!", ads);
      } else return apiResponse.ErrorResponse(res, "failed to get ads");
    } catch (e) {
      console.log(e);
      return apiResponse.ErrorResponse(res, "failed to get ads");
    }
    // let params = req.query;
    // console.log(filterQueryParams(req.query));
    // let filter = filterQueryParams(req.query);
    // AdModel.find({
    //   $and: [
    //     ...filter,
    //     /* {
    //       address: { $regex: ".*" + req.query.address }
    //     },
    //     { purpose: req.query.purpose },
    //     {
    //       price: {
    //         $lte: req.query.priceMax,
    //         $gte: req.query.priceMin
    //       }
    //     } */
    //     //filterQueryParams(req.query)
    //   ],
    // }).then(
    //   (ad) => {
    //     if (!ad.isEmpty)
    //       return apiResponse.successResponseWithData(res, "Ad Found!", ad);
    //   },
    //   (err) => {
    //     return apiResponse.ErrorResponse(res, err);
    //   }
    // );
  },
];
exports.getLatestAds = [
  check("page").isNumeric(),
  async (req, res) => {
    try {
      let result = [];
      let query = AdModel.find({});
      let ads = await new ApiFeatures(query, req.query)
        .sort()
        .filter()
        .paginate()
        .query.populate("petId")
        .exec();
      if (ads && !ads.isEmpty) {
        return apiResponse.successResponseWithData(res, "Ad Found!", ads);
      }
    } catch (e) {
      return apiResponse.ErrorResponse(res, "failed to get ads");
    }
  },
];
exports.getAdById = [
  auth,
  async (req, res) => {
    if (!ObjectID.isValid(req.params.id)) {
      return apiResponse.ErrorResponse(res, "Ad id is not valid");
    }
    try {
      let ad = await AdModel.findById(new ObjectID(req.params.id)).exec();
      console.log(ad);
      if (ad) {
        let pet = await PetModel.findById(ad.petId);
        if (pet && pet.belongToAd) {
          let finalAd = await ad.populate("petId").execPopulate();
          return apiResponse.successResponseWithData(res, "Ad Found", finalAd);
        }
      } else {
        return apiResponse.ErrorResponse(res, "can't find ad with this Id");
      }
    } catch (e) {
      return apiResponse.ErrorResponse(res, "can't find ad with this Id");
    }
  },
];
// // function validateAddAd(req) {
// //   req.checkbody("name", "Name is required.").isLength({ min: 1 }),
// //     req.checkbody("age", "Age is required").isNumeric(),
// //     req
// //       .checkbody("category", "You must choose a category Id")
// //       .isNumeric()
// //       .isLength({ min: 1 }),
// //     req.checkbody("gender", "Geder error check").matches("[MF]+"),
// //     req
// //       .checkbody("subcategory", "You must select a subcategory Id")
// //       .isNumeric()
// //       .isLength({ min: 1 }),
// //     req.checkbody("price").isNumeric(),
// //     req.checkbody("address").isString(),
// //     req.checkbody("phoneNumber").isMobilePhone("ar-EG"),
// //     req.checkbody("purpose").isString(),
// //     req
// //       .checkbody("userid")
// //       .isLength({ min: 1 })
// //       .custom((val) => {
// //         return UserModel.findById(new ObjectID(val), (err, user) => {
// //           if (!err) return Promise.reject("user not found");
// //         });
// //       });
// }
