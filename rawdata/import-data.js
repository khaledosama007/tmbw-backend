const fs = require("fs");
const mongoose = require("mongoose");
const CategoryModel = require("./../models/CategoryModel").CategoryModel;
const SUbcategoryModel = require("./../models/SubcategoryModel")
  .SubcategoryModel;
const auth = require("../middlewares/jwt");
exports.importData = [
  auth,
  (req, res) => {
    importCats();
    importDogs();
    importHorses();
    importBirds();
    console.log("Req");
    return res.status(200);
  },
];
function importCats() {
  const cats = JSON.parse(fs.readFileSync(`${__dirname}/cats.json`, "utf-8"));
  //let catsCategory = await CategoryModel.create({ name: "Cats" });
  let subcategories = [],
    subcategoriesIds = [];
  let subCategoriesMap = cats.cats.map((subName, index) => {
    subcategories.push({ name: subName, id: index + 1 });
  });
  SUbcategoryModel.insertMany(subcategories).then(
    (value) => {
      console.log("Saved");
      value.forEach((element) => {
        subcategoriesIds.push(element._id);
      });
      new CategoryModel({ name: "Cats", subs: subcategoriesIds, id: 1 }).save();
    },
    (err) => console.log(err)
  );
  fs.writeFileSync(
    `${__dirname}/catsNew.json`,
    JSON.stringify(subcategories),
    "utf-8"
  );
}
function importDogs() {
  const dogs = JSON.parse(fs.readFileSync(`${__dirname}/dogs.json`, "utf-8"))
    .dogs;
  //let catsCategory = await CategoryModel.create({ name: "Cats" });
  let subcategories = [],
    subcategoriesIds = [];
  let subCategoriesMap = dogs.map((subName, index) => {
    subcategories.push({ name: subName, id: index + 1 });
  });
  SUbcategoryModel.create(subcategories).then((value) => {
    value.forEach((element) => {
      subcategoriesIds.push(element._id);
    });
    new CategoryModel({ name: "Dogs", subs: subcategoriesIds, id: 2 }).save();
  });
  fs.writeFileSync(
    `${__dirname}/dogsNew.json`,
    JSON.stringify(subcategories),
    "utf-8"
  );
}

function importHorses() {
  const horses = JSON.parse(
    fs.readFileSync(`${__dirname}/horses.json`, "utf-8")
  ).horses;
  //let catsCategory = await CategoryModel.create({ name: "Cats" });
  let subcategories = [],
    subcategoriesIds = [];
  let subCategoriesMap = horses.map((subName, index) => {
    subcategories.push({ name: subName, id: index + 1 });
  });
  SUbcategoryModel.create(subcategories).then((value) => {
    value.forEach((element) => {
      subcategoriesIds.push(element._id);
    });
    new CategoryModel({ name: "Horses", subs: subcategoriesIds, id: 3 }).save();
  });
  fs.writeFileSync(
    `${__dirname}/horsesNew.json`,
    JSON.stringify(subcategories),
    "utf-8"
  );
}

function importBirds() {
  const birds = JSON.parse(fs.readFileSync(`${__dirname}/Birds.json`, "utf-8"));
  let subcategories = [],
    subcategoriesIds = [];
  let subCategoriesMap = birds.map((subName, index) => {
    subcategories.push({ name: subName, id: index + 1 });
  });
  SUbcategoryModel.create(subcategories).then((value) => {
    value.forEach((element) => {
      subcategoriesIds.push(element._id);
    });
    new CategoryModel({ name: "Birds", subs: subcategoriesIds, id: 4 }).save();
  });
  fs.writeFileSync(
    `${__dirname}/BirdsNew.json`,
    JSON.stringify(subcategories),
    "utf-8"
  );
}
