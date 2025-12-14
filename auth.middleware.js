import jwt from "jsonwebtoken";

//protectRoute middleware

export const protectRoute = async (req, res, next) => {


    try {
        const accessToken = req.cookies.accessToken;
        if (!accessToken) {
            return res.status(401).json({ message: "Access Denied. No token provided" });
        }
        try {
            const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);

            const user = await User.findById(decoded.id).select("-password");//exclude password field 
            if (!user) {
                return res.status(401).json({ message: "User not found" });
            }

            req.user = user; //attach user to request object
            next(); //proceed to next middleware or route handler   

        }

        catch (err) {
            if (err.name === "TokenExpiredError") {
                return res.status(401).json({ message: "Access token expired" });
            }
            throw err; //rethrow other errors to be caught by outer catch
        }

    }
    catch (error) {
        console.log("Auth Middleware Error:", error.message);
        res.status(401).json({ message: "Invalid access token" });
    }
}


//admin route middleware
export const adminRoute = (req, res, next) => {
    if (req.user && req.user.role === "admin") {
        next();
    }
    else {
        return res.status(403).json({ message: "Access denied. Admins only" });
    }

}