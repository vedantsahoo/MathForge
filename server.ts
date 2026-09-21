import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "2mb" }));

  // API Health
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // AI Explanation Endpoint
  app.post("/api/ai-explain", async (req, res) => {
    try {
      const { problem, answer, steps, method, mode } = req.body;

      if (!problem || !answer) {
        return res.status(400).json({ error: "Problem and answer are required" });
      }

      const ai = getAI();
      if (!ai) {
        return res.status(503).json({
          error: "AI service not configured (GEMINI_API_KEY missing)",
          explanation: "The AI explanation service requires a GEMINI_API_KEY. However, your mathematical calculation was completed with verified exact mathematical reasoning above.",
        });
      }

      const prompt = `You are the AI pedagogical assistant for MathForge, a rigorous mathematical computation platform.
A mathematical calculation has ALREADY been calculated and verified by the mathematical engine:

- Problem: ${problem}
- Verified Answer: ${answer}
- Computation Mode: ${mode || "General"}
- Method Used: ${method || "Standard Analytical Method"}
- Verified Derivation Steps:
${Array.isArray(steps) ? steps.map((s: any, idx: number) => `  Step ${idx + 1}: ${s.title || ""} - ${s.math || s.explanation || JSON.stringify(s)}`).join("\n") : steps}

STRICT INSTRUCTIONS:
1. NEVER alter, contradict, or invent new mathematical steps or answers.
2. The engine's result "${answer}" is absolute truth.
3. Provide an intuitive, educational explanation of the underlying mathematical concepts, intuition, and why this method works in simple yet rigorous terms.
4. Structure your response with:
   - **Core Concept & Intuition**: What this operation fundamentally means geometrically or algebraically.
   - **Key Step Walkthrough**: Clarifying why each transformation occurred (e.g. factoring, chain rule, substitution).
   - **Verification / Sanity Check**: How to check or think about this result in real life or graphical terms.
5. Format with clean Markdown and standard LaTeX ($...$ or $$...$$) where helpful.
Keep it concise, encouraging, and pedagogically clear.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
      });

      const explanation = response.text || "No explanation generated.";
      res.json({ explanation });
    } catch (err: any) {
      console.error("AI Explain Error:", err);
      res.status(500).json({
        error: "Failed to generate explanation",
        details: err?.message || String(err),
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MathForge server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
