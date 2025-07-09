import fetch from "node-fetch";
if (!globalThis.fetch) globalThis.fetch = fetch;

import { GoogleGenerativeAI } from "@google/generative-ai";

export const config = {
  runtime: "edge",
};

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  throw new Error("❌ GEMINI_API_KEY tidak ditemukan.");
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export default async function handler(req) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*", // Ganti dengan frontend URL jika perlu
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  // 💡 Handle preflight request (CORS OPTIONS)
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Metode tidak diizinkan. Hanya POST." }), {
      status: 405,
      headers,
    });
  }

  const body = await req.json();
  const { prompt } = body;

  if (!prompt) {
    return new Response(JSON.stringify({ error: "Prompt tidak ditemukan." }), {
      status: 400,
      headers,
    });
  }

  try {
    const chat = model.startChat({ history: [] });
    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const reply = response.text();

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("❌ Error Gemini:", error);
    return new Response(JSON.stringify({ error: "Gagal mengambil respon dari Gemini." }), {
      status: 500,
      headers,
    });
  }
}
