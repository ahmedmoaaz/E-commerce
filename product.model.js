import mongoose from "mongoose";

export const productSchema = new mongoose.Schema({
    name:{type:String,required:true},
    description:{type:String,required:true},
    price:{type:Number,min:0,required:true},
    image:{type:String,required:true},
    category:{type:String,required:true},
    stock:{type:Number,required:true,default:0 },
    isFeatured:{type:Boolean,default:false}
},{timestamps:true});


//create and export product model

const Product = mongoose.model("Product",productSchema);

export default Product;