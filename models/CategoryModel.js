let monsgoose = require("mongoose");

let CategorySchema = new monsgoose.Schema({
  name: { type: String, required: true },
  subs: [{ type: monsgoose.Schema.Types.ObjectId, ref: "Subcategory" }],
  id: { type: Number, required: true }
});

exports.CategoryModel = monsgoose.model("Category", CategorySchema);
