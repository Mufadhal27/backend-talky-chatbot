import dotenv from "dotenv";
dotenv.config();

import fetch from "node-fetch";
if (!globalThis.fetch) globalThis.fetch = fetch;

import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  throw new Error("GEMINI_API_KEY tidak ditemukan.");
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

app.post("/api/chat", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt tidak ditemukan dalam permintaan." });
  }

  try {
    const chat = model.startChat({ history: [] });
    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const reply = response.text();

    res.status(200).json({ reply });
  } catch (error) {
    if (error.message.includes("API key not valid")) {
      res.status(500).json({ error: "Kunci API Gemini tidak valid. Periksa .env Anda." });
    } else {
      res.status(500).json({ error: "Gagal mendapatkan respon dari Gemini." });
    }
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server chatbot aktif di http://localhost:${PORT}`);
});
