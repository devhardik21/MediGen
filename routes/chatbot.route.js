//chatbot.route.js
import dotenv from "dotenv";
import fetch from "node-fetch";
import Chat from "../models/chat.models.js"; // Importing chat schema

dotenv.config();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

let callName="";

/* Set username for the session and create chat history if new user
 */
const SetName = async (req, res) => {
    try {
        const {email} = req.user ;
        const { name } = req.body;
        callName = name ;
        if (!email || !name) {
            return res.status(400).json({ error: "Email and Name are required" });
        }

        // Find existing user or create a new chat history
        let chat = await Chat.findOne({ email });

        if (!chat) {
            chat = new Chat({ email, username: name, messages: [] });
            await chat.save();
        }

        res.json({ message: `Hello ${name}! Welcome to MediGen, MediBot here! How can I help you?` });
    } catch (error) {
        console.error("Error setting username:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Handles user chat and fetches AI response
 */
const BotChat = async (req, res) => {
    try {
        const {message } = req.body ;
        const {email} = req.user ;
        if (!email || !message) {
            return res.status(400).json({ error: "Email and message are required" });
        }

        // Retrieve user's chat history
        let chat = await Chat.findOne({ email });

        if (!chat) {
            return res.status(404).json({ error: "User not found. Please set your username first." });
        }

        console.log(`User (${chat.username}): ${message}`);

        if (!GEMINI_API_KEY) {
            return res.status(500).json({ error: "API key is missing" });
        }

        // Structure prompt with chat history for better responses
        const chatHistory = chat.messages.map(msg => `${msg.sender}: ${msg.text}`).join("\n");
        const structuredPrompt = `You are MediGen, a medical healthcare assistant bot. 
        Be friendly and kind. Avoid non-medical topics. 
        The user is ${callName}. Chat history:\n${chatHistory}\n and the message by him is: ${message}`;

        // Fetch response from Gemini API
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: structuredPrompt }] }],
                    generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({ error: data });
        }

        // Extract AI response
        const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response received";

        // Update chat history
        chat.messages.push({ sender: "user", text: message });
        chat.messages.push({ sender: "bot", text: aiReply });
        await chat.save();

        res.json({ reply: aiReply });
    } catch (error) {
        console.error("Error processing chat:", error);
        res.status(500).json({ error: "Something went wrong" });
    }
};

const UserHistory  = async (req,res) => {
    
       try {
         const {email}  = req.user ; 
         if (!email) {
             res.status(400).json({error : "Enter email first"}) ; 
         }
 
         const PersonChats  = await Chat.findOne({email}) ;
         if(!PersonChats){
             res.status(401).json({message :`the user has no chat history yet`}) ; 
         }
         else{
             res.status(200).json({message : PersonChats.messages}) ;
         }
 }
       catch (error) {
            console.log(`we got an error while fetching the chat history of the user. Error is ${error}`);
       }
    }
/**
 * Fetches available AI models
 */


export { SetName, BotChat,UserHistory}
