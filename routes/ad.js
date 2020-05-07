var express = require("express");
const multer = require("multer");
const AdController = require("../controllers/AdController");

var router = express.Router();

router.post(
  "/add-ad",
  multer({ dest: "temp/", limits: { fieldSize: 8 * 1024 * 1024 } }).array(
    "petPhotos",
    3
  ),
  AdController.addAd
);
router.post("/add-ad-from-mypet", AdController.addAdWithMyPet);
router.delete("/:id", AdController.deleteAd);
router.get("/search", AdController.search);
router.get("/getLatestAds" , AdController.getLatestAds)
/* router.delete("/delete-pet/:id", PetController.deletePet);
router.get("/:id" , PetController.getById);
router.get("/get-user-pets/:userid",PetController.getUserPets); */
module.exports = router;
