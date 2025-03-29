import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
    email: { type: String, required: true }, // Each user identified by email
    username: { type: String, required: true }, // User's name
    messages: [
        {
            sender: { type: String, enum: ["user", "bot"], required: true },
            text: { type: String, required: true },
            timestamp: { type: Date, default: Date.now }
        }
    ]
});

const Chat = mongoose.model("Chat", chatSchema);
export default Chat;
