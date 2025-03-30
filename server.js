//server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { SetName, BotChat, UserHistory } from "./routes/chatbot.route.js";
import DataBaseConnection from "./db/index.js";
import registerUser from "./controller/register.controller.js";
import { UserLogin } from "./controller/register.controller.js";
import { scrapeApollo } from "./routes/final_scrape.js";
import { scrapeNetmeds } from "./routes/final_scrape.js";
import { scrapePharmEasy } from "./routes/final_scrape.js";
import { VerifyToken } from "./middlewares/auth.middleware.js";
dotenv.config();
import cookieParser from "cookie-parser";

// Database connection
DataBaseConnection();
const app = express();
const PORT = process.env.PORT || 5000;

// Use CORS with specific origin and credentials enabled
app.use(cors({
    origin: [
      "https://medi-gen-2tnn.vercel.app",
      "https://medi-gen-2tnn-git-master-hardiks-projects-8b7844aa.vercel.app",
      "https://medi-gen-2tnn-qzmrcsl1y-hardiks-projects-8b7844aa.vercel.app",
      "https://medigen.netlify.app"
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Other middleware
app.use(express.json());
app.use(cookieParser());

// Define routes
app.post('/api/setname',VerifyToken, SetName);
app.post('/api/chat',VerifyToken, BotChat);
app.get('/api/history',VerifyToken, UserHistory);
app.post('/api/register', registerUser);
app.post('/api/login', UserLogin);
app.get('/api/compare', async (req, res) => {
    const { medicine } = req.query;
    if (!medicine) {
        return res.status(401).json({ message: "send your medicine name" });
    }
    const results = await Promise.all([
        scrapeApollo(medicine),
        scrapeNetmeds(medicine),
        scrapePharmEasy(medicine)
    ]);
    res.json(results);
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
