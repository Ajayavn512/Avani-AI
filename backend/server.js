import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;
const apiKey = process.env.OPENROUTER_API_KEY?.trim();

console.log(
  "🔐 OpenRouter key:",
  apiKey ? `PRESENT (${apiKey.length} chars)` : "MISSING"
);

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    status: "online",
    message: "Avani AI Backend is running 🚀",
    mode: apiKey ? "AI Mode" : "API KEY MISSING"
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: "Message is required"
      });
    }

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: "OPENROUTER_API_KEY is missing"
      });
    }

    console.log("👤 User:", message);

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://ajayavn512.github.io/Avani-AI/",
          "X-Title": "Avani AI"
        },
        body: JSON.stringify({
          model: "Ajayavn512/DeepSeek-V4.1-Flash-bucket",
          messages: [
            {
              role: "system",
              content:
                "You are Avani, a helpful AI assistant. If the user speaks Hindi or Hinglish, reply naturally in Hindi/Hinglish. If the user speaks English, reply naturally in English. Be friendly, intelligent, clear and conversational."
            },
            {
              role: "user",
              content: message
            }
          ]
        })
      }
    );

    const data = await response.json();

    console.log("OpenRouter status:", response.status);

    if (!response.ok) {
      console.error("❌ OpenRouter Error:", data);

      return res.status(response.status).json({
        success: false,
        error: data?.error?.message || "OpenRouter request failed"
      });
    }

    const reply = data?.choices?.[0]?.message?.content;

    if (!reply) {
      throw new Error("No AI response received");
    }

    console.log("🤖 Avani:", reply);

    res.json({
      success: true,
      reply,
      mode: "ai"
    });

  } catch (error) {
    console.error("❌ Avani Error:", error);

    res.status(500).json({
      success: false,
      error: error?.message || "AI request failed"
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("🤖 ===============================");
  console.log("🤖       AVANI AI IS ONLINE");
  console.log("🤖 ===============================");
  console.log(`🤖 Server running on port ${PORT}`);
});