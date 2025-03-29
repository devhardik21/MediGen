import jwt from "jsonwebtoken";

const VerifyToken = async (req, res, next) => {
    try {
        // Extract token from header or cookies
        console.log("are we reaching here??");
        const token = req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            return res.status(401).json({ error: "Verification failed due to missing token" });
        }

        // Verify if the token is valid
        const data = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        console.log("Token successfully verified:", data);
        
        req.user = data; // Attach user info to request object
        
        next(); // Move to the next middleware or route handler

    } catch (error) {
        return res.status(403).json({ error: "Invalid or expired token" });
    }
};

export { VerifyToken };
