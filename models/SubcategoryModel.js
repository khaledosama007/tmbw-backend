let monsgoose = require("mongoose");
let SubcategorySchema = new monsgoose.Schema({
  name: { type: String, required: true },
  id: { type: Number, required: true },
});
exports.SubcategoryModel = monsgoose.model("Subcategory", SubcategorySchema);
