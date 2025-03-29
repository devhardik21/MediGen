import mongoose from "mongoose";
import dotenv from "dotenv" ; 
const DBNAME = "MEDIGEN";
const DbConnect = async () => {
   try {
     const ConnectInstance = await mongoose.connect(`${process.env.MONGO_URI}/${DBNAME}`)
     console.log("Database is successfully connected");
    // console.log(ConnectInstance);
   } catch (error) {
    console.log("we got an error",error);
   }
}
export default DbConnect  ;