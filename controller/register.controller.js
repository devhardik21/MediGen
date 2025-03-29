    
import { User } from "../models/user.models.js";

const registerUser = async (req, res) => {
    try {
        // Extracting data from the frontend 
        const { username, email, password, dob } = req.body;

        // Checking if all fields are provided
        if (!username?.trim() || !email?.trim() || !password?.trim() || !dob) {
            return res.status(400).json({ error: "All fields must be filled" });
        }
        // Checking if the user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ error: "This email already exists" });
        }

        // Creating a new user
        const user = await User.create({
            username,
            email,
            password,
            dob,
        });

        console.log("User successfully created:", user);

        // Fetching the created user without sensitive data
        const finalUser = await User.findById(user._id).select("-password -RefreshToken").exec();
        
        if (finalUser) {
            console.log("User registered successfully!");
            return res.status(201).json({ message: "User registered", user: finalUser });
        } else {
            return res.status(500).json({ error: "User could not be retrieved after creation" });
        }
    } catch (error) {
        console.error("Error registering user:", error);
        return res.status(500).json({ error: "Server error. User can't be registered" });
    }
};

// Code for logging in 
const UserLogin = async (req,res) => {
    try {
        // extracting contents from the user 
        const {email,password} = req.body  ;
        
        //checking if the user exists  
        const user = await User.findOne({email}) ; 
        if(!user){
            return res.status(409).json({message:"user dosen't exist"}) ;
        }
        // checking if the password is correct or not

        const isPasswordCorrect = await user.ComparePasswords(password) ;
        if(!isPasswordCorrect){
            return res.status(403).json({message:"Inavalid Credentials"}) ;
        }
       
         const accessToken = user.GenerateAccessToken() ; 
         const refreshToken = user.GenerateRefreshToken() ; 
         user.refreshtoken = refreshToken ;
         console.log(`accessToken : ${accessToken}`);
         console.log(`refreshToken : ${refreshToken}`);
         const options = {
            httpOnly: false,
            secure: process.env.NODE_ENV === "production", // Secure only in production
            sameSite: "strict",
            path : '/'
        };
        
       res.status(201)
       .cookie("accessToken",accessToken,options)
       .cookie("refreshToken",refreshToken,options)
       .cookie("email",email,{
         path: "/"
       })
       .json({message : "user logged in successfully",
        token : accessToken}) ; 

        

    } catch (error) {
       console.log("we got an error registering the user",error); 
    }

}

export default registerUser;
export  {UserLogin};

