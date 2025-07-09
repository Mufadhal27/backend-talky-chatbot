import fetch from "node-fetch";
if (!globalThis.fetch) globalThis.fetch = fetch;

import { GoogleGenerativeAI } from "@google/generative-ai";

// Ambil API Key dari Environment Variable
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  throw new Error("❌ GEMINI_API_KEY tidak ditemukan.");
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Export handler untuk digunakan sebagai serverless function
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metode tidak diizinkan. Hanya POST." });
  }

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt tidak ditemukan." });
  }

  try {
    const chat = model.startChat({ history: [] });
    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const reply = response.text();

    return res.status(200).json({ reply });
  } catch (error) {
    console.error("❌ Error Gemini:", error);
    return res.status(500).json({ error: "Gagal mengambil respon dari Gemini." });
  }
}
