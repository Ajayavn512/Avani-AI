import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config({ path: ".env" });

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY;

console.log("API KEY LOADED:", apiKey ? "YES ✅" : "NO ❌");

if (!apiKey) {
    console.error("❌ GEMINI_API_KEY missing in .env");
}

const ai = new GoogleGenAI({
    apiKey: apiKey
});

app.get("/", (req, res) => {
    res.send("Avani AI Backend is running 🚀");
});

app.post("/api/chat", async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({
                error: "Message is required"
            });
        }

        const response = await ai.models.generateContent({
             model: "gemini-3.6-flash",
            contents: message
        });

        res.json({
            success: true,
            reply: response.text
        });

    } catch (error) {
        console.error("Gemini Error:", error);

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Avani AI Backend: http://localhost:${PORT}`);
});