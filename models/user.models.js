import mongoose from "mongoose";
import { Schema } from "mongoose";
import  Jwt  from "jsonwebtoken";
import bcrypt from "bcrypt" ;
import dotenv from "dotenv" ;  
dotenv.config() ;
//creating an user schema 
const UserSchema = new Schema({
username : {
    type : String,
    required : true 
},
email: {
    type : String,
    required : true, 
    unique : true
},
password : {
    type : String,
    required : true 
},
dob : {
    type : String,
    required : true
},
refreshtoken: {
    type : String,
    required : false
}
},
{timestamps : true})


//hashing the password before saving 
UserSchema.pre("save", async function(next){
    if(!this.isModified("password")){
        return next() ;
    }
    this.password = await bcrypt.hash(this.password,10);
    next() ;
})

UserSchema.methods.ComparePasswords = async function(password){
    return await bcrypt.compare(password,this.password) ;
} 

// making the functions for generating the access token 
UserSchema.methods.GenerateAccessToken = function(){
    return Jwt.sign(
    {
        _id :this._id ,
        email:this.email,
        username : this.username
    },
    process.env.ACCESS_TOKEN_SECRET,
    {expiresIn : process.env.ACCESS_TOKEN_EXPIRY}
    )
}
UserSchema.methods.GenerateRefreshToken =  function(){
    return Jwt.sign(
    {
        _id :this._id 
    },
    process.env.REFRESH_TOKEN_SECRET,
    {expiresIn : process.env.REFRESH_TOKEN_EXPIRY}
    )
}

export const User = mongoose.model("User",UserSchema) ;
