

import Product from '../models/product.model.js';
import { redis } from '../lib/redis.js';
import cloudinary from '../lib/cloudinary.js';

export const getAllProducts = async(req,res)=>{


    try{
        const products = await Product.find({}); //find all products

        res.status(200).json({products});
    }

    catch(error){
        res.status(500).json({message:"Server error"});
    }

}


export const getFeaturedProducts = async(req,res)=>{
    try{
        let featuredProducts = await Product.find({isFeatured:true});

        if(featuredProducts)
        {
           return res.json(JSON.parse(featuredProducts));
        }

        //if not in redis fetch from mongodb
        //.lean() to get a plain js object instead of mongoDB document
        // which is good for performance

        featuredProducts= await Product.find({isFeatured:true}).lean();
        if(!featuredProducts)
        {
            return res.status(404).json({message:"No featured products found"});
        }

        //stored in redis future access
        await redis.set("featured_products",JSON.stringify(featuredProducts));

        res.json(featuredProducts);
}

catch(error){
    console.log("Error fetching featured products:", error.message);
res.status(500).json({message:"Server error"});

}




}


export const createProduct = async(req,res)=>{
    try{
        const {name,description,price,image,category} = req.body; 
        let cloudinaryResponse =null;

        if(image){
            cloudinaryResponse= await cloudinary.uploader.upload(image,{folder:products});
        }

        const product = new Product.create({
            name,description,price,
            image:cloudinaryResponse?cloudinaryResponse.secure_url : "",
            category
        })

        res.status(201).json({product});
    }
    catch(error){
        console.log("Error creating product:", error.message);
        res.status(500).json({message:"Server error"});
    }
}

