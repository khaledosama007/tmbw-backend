let monsgoose = require("mongoose");

let AdSchema = monsgoose.Schema({
    petId : {type : monsgoose.Schema.Types.ObjectId , required:true},
    price : {type : Number , required : true},
    address : {type: String , required : true},
    phoneNumber : {type : String , required : true},
    purpose : {type : String , required : true},
    verified : {type : Boolean , required : true},
    userId:{type : monsgoose.Schema.Types.ObjectId , required : true}
});

module.exports = monsgoose.model("Ad" , AdSchema);