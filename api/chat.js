import fetch from "node-fetch";
if (!globalThis.fetch) globalThis.fetch = fetch;

// Import library yang dibutuhkan
import mongoose from "mongoose";
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- DEBUGGING: Tambahkan ini di awal file ---
console.log("Serverless function chat.js starting up...");
// ---------------------------------------------

// ====== MONGODB SETUP ======
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb && cachedDb.connections[0].readyState === 1) {
    console.log("✅ Menggunakan koneksi MongoDB yang sudah ada.");
    return cachedDb;
  }

  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.error("❌ MONGO_URI tidak ditemukan. Cek environment variable Vercel.");
    throw new Error("MONGO_URI tidak ditemukan.");
  }

  try {
    console.log("Connecting to MongoDB Atlas...");
    const db = await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    cachedDb = db;
    console.log("✅ Terhubung ke MongoDB Atlas.");
    return db;
  } catch (err) {
    console.error("❌ Gagal konek MongoDB:", err);
    throw err;
  }
}

// ====== SCHEMA ======
let Chat;
try {
  Chat = mongoose.model("Chat");
} catch (error) {
  const chatSchema = new mongoose.Schema({
    prompt: String,
    reply: String,
    createdAt: { type: Date, default: Date.now },
  });
  Chat = mongoose.model("Chat", chatSchema);
}

// ====== GEMINI SETUP ======
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error("❌ API Key Gemini tidak ditemukan. Cek environment variable Vercel.");
  throw new Error("GEMINI_API_KEY tidak ditemukan.");
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// ====== SERVERLESS FUNCTION HANDLER ======
async function handler(req, res) { 
  // Hanya izinkan permintaan POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Metode tidak diizinkan. Hanya POST yang didukung." });
  }

  // Pastikan koneksi ke DB sebelum setiap permintaan
  try {
    await connectToDatabase();
  } catch (dbError) {
    console.error("Gagal terhubung ke database:", dbError);
    return res.status(500).json({ error: "Terjadi kesalahan server: Gagal konek ke database." });
  }

  // Mengambil prompt dari body permintaan
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt tidak ditemukan dalam permintaan." });
  }

  try {
    const chat = model.startChat({ history: [] }); 
    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const reply = response.text();

    const newChat = new Chat({ prompt, reply });
    await newChat.save();

    res.status(200).json({ reply });
  } catch (error) {
    console.error("❌ Error Gemini atau simpan ke DB:", error);
    if (error.message.includes("API key not valid")) {
        res.status(500).json({ error: "Terjadi masalah dengan kunci API Gemini. Harap periksa kunci Anda." });
    } else {
            res.status(500).json({ error: "Gagal mendapatkan respon dari Gemini atau menyimpan chat." });
    }
  }
}

module.exports = handler;

