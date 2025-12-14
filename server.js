import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.route.js';

import cookieParser from 'cookie-parser';

import {connectDB}  from "./lib/db.js";

import productRoutes from './routes/product.route.js';





//routes

dotenv.config()
const app = express()
const port = process.env.port|| 3000;


 connectDB();

 app.use(express.json());  //middleware to parse JSON bodies 
 app.use(cookieParser());  //middleware to parse cookies

 


app.use("/api/auth",authRoutes)

app.use("/api/products",productRoutes)





// app.get('/', (req, res) => {
//   res.send('Hello World!')
// })

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)

 
})




