import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

if(!process.env.MONGODB_URI){
    throw new Error(
        "Please provide the MongoDB URI in the .env file"
    );
}

async function connectDB(){
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB ${conn.connection.host} Connected`);

    } catch (error) {
        console.log("MongoDB Connection Error", error);
        process.exit(1);
    }
}

export default connectDB;