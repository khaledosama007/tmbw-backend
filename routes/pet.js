var express = require("express");
const multer = require("multer");
const PetController = require("../controllers/PetController");

var router = express.Router();

router.post(
  "/add-pet",
  multer({ dest: "temp/", limits: { fieldSize: 8 * 1024 * 1024 } }).array(
    "petPhotos",
    3
  ),
  PetController.addPet
);
router.delete("/delete-pet/:id", PetController.deletePet);
router.get("/:id" , PetController.getById);
router.get("/get-user-pets/:userid",PetController.getUserPets);
module.exports = router;
