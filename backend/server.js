import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const apiKey = process.env.OPENROUTER_API_KEY;

const client = apiKey
  ? new OpenAI({
      apiKey: apiKey,
      baseURL: "https://openrouter.ai/api/v1",
    })
  : null;

// HOME / STATUS
app.get("/", (req, res) => {
  res.json({
    status: "online",
    message: "Avani AI backend is running 🚀",
    mode: client ? "AI Mode" : "API KEY MISSING",
  });
});

// AI CHAT
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: "Message is required",
      });
    }

    if (!client) {
      return res.status(500).json({
        success: false,
        error: "OPENROUTER_API_KEY is missing",
      });
    }

    console.log("👤 User:", message);

    const completion = await client.chat.completions.create({
      model: "Ajayavn512/DeepSeek-V4.1-Flash-bucket",

      messages: [
        {
          role: "system",
          content: `
You are Avani, a helpful AI assistant.

Your name is Avani.

If the user speaks Hindi or Hinglish,
reply naturally in Hindi/Hinglish.

If the user speaks English,
reply naturally in English.

Be friendly, intelligent, clear and conversational.
Do not mention Demo Mode.
          `,
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    const reply = completion.choices?.[0]?.message?.content;

    if (!reply) {
      throw new Error("No AI response received");
    }

    console.log("🤖 Avani:", reply);

    res.json({
      success: true,
      reply,
      mode: "ai",
    });

  } catch (error) {
    console.error("❌ Avani Error:", error);

    res.status(500).json({
      success: false,
      error: error?.message || "AI request failed",
    });
  }
});

app.listen(PORT, () => {
  console.log("");
  console.log("🤖 ===============================");
  console.log("🤖       AVANI AI IS ONLINE");
  console.log("🤖 ===============================");
  console.log(`🤖 Server: http://localhost:${PORT}`);

  if (client) {
    console.log("🤖 Mode: OPENROUTER AI");
    console.log("🤖 Model: Ajayavn512/DeepSeek-V4.1-Flash-bucket");
  } else {
    console.log("🤖 Mode: API KEY MISSING ❌");
  }

  console.log("");
});