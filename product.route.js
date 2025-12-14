/*import express from "express";

import { getAllProducts } from "../controllers/product.controller.js";

const router = express.Router();

router.get("/",protectRoute,adminRoute, getAllProducts);



export default router;*/

import express from "express";
import { getAllProducts,getFeaturedProducts,createProduct } from "../controllers/product.controller.js";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", protectRoute, adminRoute, getAllProducts);

router.get("/featured", protectRoute,adminRoute, getFeaturedProducts)

router.post("/",protectRoute,adminRoute, createProduct)

router.delete("/:id",protectRoute,adminRoute,deleteProduct)





export default router;
