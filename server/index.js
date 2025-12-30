import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import helmet from 'helmet';
import connectDB from './config/connectDB.js';
import userRouter from './routes/user.routes.js';
import uploadRouter from './routes/upload.routes.js';
import campaignRouter from './routes/campaign.routes.js';
import donationRouter from './routes/donation.routes.js';
import stripeRouter from './routes/stripe.routes.js';
import satelliteRouter from './routes/satellite.routes.js';


dotenv.config();

const app = express();

app.use(express.json());
app.use(cors({
    credentials: true,
    origin: process.env.FRONTEND_URL
}));

app.use(cookieParser());
app.use(morgan('dev'));
app.use(helmet({
    crossOriginResourcePolicy : false
}));

const PORT = process.env.PORT || 8080;

app.get("/",(req,res)=>{
    res.json({
        message: `Server is running on PORT ${PORT}`
    });
});

app.use("/api/user", userRouter);
app.use("/api/file", uploadRouter);
app.use("/api/campaigns", campaignRouter);
app.use("/api/donations", donationRouter);
app.use("/api/stripe", stripeRouter);
app.use("/api/satellite", satelliteRouter);


connectDB().then(()=>{
    app.listen(PORT, ()=>{
        console.log("Server is running on PORT", PORT);
    });
}).catch((error)=>{
    console.log("MongoDB Connection Error", error);
    process.exit(1);
});