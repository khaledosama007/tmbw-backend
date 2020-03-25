let monsgoose = require("mongoose");

let CategorySchema = new monsgoose.Schema({
    name : {type : String , required:true},
    id : {type:monsgoose.Schema.Types.ObjectId , required:true}
});

let SubcategorySchema = new monsgoose.Schema({
    name:{ type : String , required:true},
    id:{type : Number , required : true},
    categoryId : {type : monsgoose.Schema.Types.ObjectId ,ref:'Category' }
})
exports.CategorySchema = monsgoose.model("Category" , CategorySchema);
exports.SubcategorySchema = monsgoose.model("Subcategory" , SubcategorySchema);