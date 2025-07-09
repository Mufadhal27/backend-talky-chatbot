import { GoogleGenerativeAI } from "@google/generative-ai";
import fetch from "node-fetch";
if (!globalThis.fetch) globalThis.fetch = fetch;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metode tidak diizinkan. Gunakan POST." });
  }

  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Prompt tidak ditemukan." });
  }

  try {
    const chat = model.startChat({ history: [] });
    const result = await chat.sendMessage(prompt);
    const reply = (await result.response).text();
    res.status(200).json({ reply });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: "Gagal memproses permintaan." });
  }
}
