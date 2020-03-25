let mongoose = require("mongoose");

let PetSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String , required : true },
  category: { type: Number, required: true },
  subcategory: { type: Number, required: true },
  price: { type: Number, required: false },
  address: { type: String, required: false },
  pics: { type: [String], required: false },
  description: { type: String, required: false },
  vaccinated: { type: Boolean, required: false },
  owner: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
  belongToAd : {type : Boolean , required:true , default:false}
});

module.exports = mongoose.model("Pet", PetSchema);
