const PetModel = require("../models/PetModel");
const UserModel = require("../models/UserModel");
const AdModel = require("../models/AdModel");
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

exports.addAd = [
  auth,
  body("name", "Name is required.").isLength({ min: 1 }),
  body("age", "Age is required").isNumeric(),
  body("category", "You must choose a category Id")
    .isNumeric()
    .isLength({ min: 1 }),
  check("gender", "Geder error check").matches("[MF]+"),
  body("subcategory", "You must select a subcategory Id")
    .isNumeric()
    .isLength({ min: 1 }),
  body("price").isNumeric(),
  body("address").isString(),
  body("phoneNumber").isMobilePhone("ar-EG"),
  body("purpose").isString(),
  check("userid")
    .isLength({ min: 1 })
    .custom((val) => {
      return UserModel.findById(new ObjectID(val), (err, user) => {
        if (!err) return Promise.reject("user not found");
      });
    }),
  (req, res) => {
    try {
      let errors = validationResult(req);
      if (!errors.isEmpty()) {
        return apiResponse.validationErrorWithData(
          res,
          "Validation Error",
          errors.array()
        );
      }
      let imagesArr = [];
      UserModel.findById(req.body.userid).then(
        (user) => {
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
            Promise.all(promises).then(
              (arr) => {
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
                //newPet.pics.push(...imagesArr);

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
              },
              (err) => {
                console.log("errorInPromiseAll" + err);
                return apiResponse.ErrorResponse(
                  res,
                  "Failed to upload Image , try again"
                );
              }
            );
            // });
          }
        },
        (err) => {
          console.log(err);
        }
      );
    } catch (err) {
      console.log(err);
    }
  },
];

exports.addAdWithMyPet = [
  auth,
  body("price").isNumeric(),
  body("address").isString(),
  body("phoneNumber").isMobilePhone("ar-EG"),
  body("purpose").isString(),
  check("userid")
    .isLength({ min: 1 })
    .custom((val) => {
      return UserModel.findById(new ObjectID(val), (err, user) => {
        if (!user) return Promise.reject("user not found");
      }).catch((err) => {});
    }),
  body("petid")
    .isLength({ min: 1 })
    .custom((petid) => {
      return PetModel.findById(new ObjectID(petid), (err, pet) => {
        if (!pet) return Promise.reject("Pet id not found");
      }).catch((err) => {});
    }),
  (req, res) => {
    console.log(req.body);
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return apiResponse.validationErrorWithData(
        res,
        "Validation Error",
        errors.array()
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
    let newAd = new AdModel({
      petId: req.body.petid,
      price: req.body.price,
      address: req.body.address,
      phoneNumber: req.body.phoneNumber,
      purpose: req.body.purpose,
      verified: false,
      userId: req.body.userid,
    });
    newAd.save((err, ad) => {
      if (err)
        return apiResponse.ErrorResponse(res, "Error happende try again later");
      return apiResponse.successResponseWithData(
        res,
        "Ad posted successfully",
        ad
      );
    });
  },
];

exports.deleteAd = [
  auth,
  (req, res) => {
    if (!ObjectID.isValid(req.params.id)) {
      return apiResponse.ErrorResponse(res, "Ad id is not valid");
    }
    AdModel.findById(new ObjectID(req.params.id)).then(
      (ad) => {
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
      },
      (err) => {
        return apiResponse.ErrorResponse(res, "can't find ad with this Id");
      }
    );
  },
];

exports.search = [
  check("address").isString(),
  check("priceMin").isNumeric(),
  check("purpose").isString(),
  check("priceMax").isString(),
  auth,
  async (req, res) => {
    let params = req.query;
    console.log(filterQueryParams(req.query));
    let filter = filterQueryParams(req.query);
    AdModel.find({
      $and: [
        ...filter,
        /* {
          address: { $regex: ".*" + req.query.address }
        },
        { purpose: req.query.purpose },
        {
          price: {
            $lte: req.query.priceMax,
            $gte: req.query.priceMin
          }
        } */
        //filterQueryParams(req.query)
      ],
    }).then(
      (ad) => {
        if (!ad.isEmpty)
          return apiResponse.successResponseWithData(res, "Ad Found!", ad);
      },
      (err) => {
        return apiResponse.ErrorResponse(res, err);
      }
    );
  },
];
exports.getLatestAds = [
  check("page").isNumeric(),
  async (req, res) => {
    let params = req.query;
    let filter = filterQueryParams(req.query);
    let query = AdModel.find({ });
    paginate(query, req.params).then(
      (ad) => {
        if (!ad.isEmpty)
          return apiResponse.successResponseWithData(res, "Ad Found!", ad);
      },
      (err) => {
        return apiResponse.ErrorResponse(res, err);
      }
    );
  },
];
function filterQueryParams(params) {
  let filter = [],
    price = {};
  if (params.address) {
    filter.push({ address: { $regex: ".*" + params.address } });
  }
  if (params.purpose) {
    filter.push({ purpose: params.purpose });
  }
  if (params.priceMin) {
    price.$gte = params.priceMin;
  }
  if (params.priceMax) {
    price.$lte = params.priceMax;
  }
  if (Object.keys(price).length !== 0) filter.push({ price });
  return filter;
}
function paginate(query, params) {
  const page = params.page * 1 || 1;
  const limit = 10;
  const skip = (page - 1) * limit;
  return query.skip(skip).limit(limit);
}
