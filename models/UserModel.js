var mongoose = require("mongoose");

var UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    isConfirmed: { type: Boolean, required: true, default: 0 },
    pets: [
      { type: mongoose.Schema.Types.ObjectId, required: false, ref: "Pet" }
    ],
    profilePic: { type: String, required: false },
    rate: { type: Number, required: false },
    phoneNumber :{type : String , required : false}
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
