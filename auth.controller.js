/*import User from "../models/User.model.js";

import jwt from "jsonwebtoken";

const generateTokens = (userId) => {
    const accessToken = jwt.sign({id: userId}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '15m'});
    const refreshToken = jwt.sign({id: userId}, process.env.REFRESH_TOKEN_SECRET, {expiresIn: '7d'});
    return {accessToken, refreshToken};
};

const storeRefreshToken= async(userId,refreshToken)=>{
    // Store refresh token in Redis or database
    await redis.set(`refreshToken:${userId}`, refreshToken,"EX",7*24*60*60); // 7 days expiration
}

const setCookies = (res, accessToken, refreshToken) => {
    res.cookie('accessToken', accessToken, { // access keyname,value
        httpOnly: true, //protect from attacks XSS , cannot be accessed by js,cross-site scripting
        secure: process.env.NODE_ENV === 'production', //only send over https in production
        sameSite: 'Strict', //prevents CSRF attacks,cross-site request forgery
        maxAge: 15 * 60 * 1000, //15 minutes
    })

    res.cookie('refreshToken', refreshToken, { // access keyname,value
        httpOnly: true, //protect from attacks XSS , cannot be accessed by js,cross-site scripting
        secure: process.env.NODE_ENV === 'production', //only send over https in production
        sameSite: 'Strict', //prevents CSRF attacks,cross-site request forgery
        maxAge: 7*24*60*60*1000, //7 days minutes
    })
};



export const signup = async(req, res) => {

    const {email , password , name} = req.body;
    try{
   const userExists = await User.findOne({ email });


    if (userExists){
        return res.status(400).json({message: "User already exists"});
    }
    const user = await User.create({name, email,password})

    const {accessToken,refreshToken}=(user._id)
    await storeRefreshToken(user._id,refreshToken);//strore refresh token   under the redis key
   setCookies(res,accessToken,refreshToken);
     res.status(201).json({user:{id:user._id,name:user.name,email:user.email,role:user.role}
    });

}
catch (error)
{
    res.status(500).json({message: "Server error"});
}
};


export const login = async(req, res) => {
    const {email , password} = req.body;
    res.send("login route");
}


export const logout = async (req, res) => {
    const {token} = req.body;
    res.send("logout route");
}*/


import User from "../models/User.model.js";
import jwt from "jsonwebtoken";
import { redis } from "../lib/redis.js";   // FIXED — import redis

// Generate access + refresh tokens
const generateTokens = (userId) => {
    const accessToken = jwt.sign({ id: userId }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "15m",
    });

    const refreshToken = jwt.sign({ id: userId }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: "7d",
    });

    return { accessToken, refreshToken };
};

// Store refresh token in Redis
const storeRefreshToken = async (userId, refreshToken) => {
    await redis.set(
        `refreshToken:${userId}`,
        refreshToken,
        "EX",
        7 * 24 * 60 * 60 // 7 days
    );
};

// Set cookies
const setCookies = (res, accessToken, refreshToken) => {
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
        maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
};

//signup controller
export const signup = async (req, res) => {
    const { email, password, name } = req.body;

    try {
        // Check if email already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Create the user (password will be hashed by pre-save hook)
        const user = await User.create({ name, email, password });

        // Generate JWT tokens
        const { accessToken, refreshToken } = generateTokens(user._id);

        // Store refresh token
        await storeRefreshToken(user._id, refreshToken);

        // Set cookies
        setCookies(res, accessToken, refreshToken);

        // Remove password before sending response
        const safeUser = user.toObject();
        delete safeUser.password;

        return res.status(201).json({
            message: "User created successfully",
            user: safeUser,
        });
    } catch (error) {
        console.error("Signup Error:", error);

        // Duplicate email
        if (error.code === 11000) {
            return res.status(400).json({ message: "Email already registered" });
        }

        return res.status(500).json({ message: "Server error" });
    }

   
};
//logon controller
export const login = async (req, res) => {
   try{
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
   if(user&&(await user.comparePassword(password))){
    const { accessToken, refreshToken } = generateTokens(user._id);
    await storeRefreshToken(user._id, refreshToken); // Store refresh token
    setCookies(res, accessToken, refreshToken);
    res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
    })
   }
   else{
    res.status(401).json({ message: "Invalid email or password" });
   }
   }
   catch(error){
    console.log("Login Error:", error.message);
    res.status(500).json({ message: "Server error" });
   }
  
};

//logout controller

export const logout = async (req, res) => {
   try {
    const refreshToken  = req.cookies.refreshToken;
    if(refreshToken){
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    await redis.del(`refreshToken:${decoded.id}`);
   }

   res.clearCookie("accessToken");
   res.clearCookie("refreshToken");
   res.status(200).json({ message: "Logged out successfully" });

   }
   

   catch (error){
    console.log("Logout Error:", error.message);
    res.status(500).json({ message: "Server error" });
   }
};

//This will refresh the access token 
//This will refresh the access token 
export const refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        // FIX 1: Check if refreshToken exists
        if (!refreshToken) {
            return res.status(401).json({ message: "No refresh token provided" });
        }

        // FIX 2: Use jwt.verify safely
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

        // FIX 3: Retrieve stored token from Redis
        const storedToken = await redis.get(`refreshToken:${decoded.id}`);

        if (!storedToken) {
            return res.status(401).json({ message: "Refresh token expired or invalid" });
        }

        // FIX 4: Compare stored token with incoming token
        if (storedToken !== refreshToken) {
            return res.status(401).json({ message: "Invalid refresh token" });
        }

        // FIX 5: Generate new access token
        const accessToken = jwt.sign(
            { id: decoded.id },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '15m' }
        );

        // FIX 6: Send new access token cookie
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 15 * 60 * 1000,
        });

        return res.json({ message: "Access token refreshed" });

    } catch (error) {
        console.log("Refresh Token Error:", error.message);
        return res.status(500).json({ message: "Server error" });
    }
};

// implement get profile controller


//accesstoken - eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5M2Q5MjIwNmQyMTA5YWNhYjViYjIxZiIsImlhdCI6MTc2NTcwODA2OCwiZXhwIjoxNzY1NzA4OTY4fQ.SqWWSbFionmKR-q4HuNXQQC7PrLFAODYZwnm9R_3C08
// another access token -eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5M2Q5MjIwNmQyMTA5YWNhYjViYjIxZiIsImlhdCI6MTc2NTcxMDc5NSwiZXhwIjoxNzY1NzExNjk1fQ.rSFasSVEsF921PbmcCOCx5-j8TDMqw3T8-6tFfWUfLg








