import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleClaudeResults } from "./routes/claude-results";
import { handleGeminiResults } from "./routes/gemini-results";
import { handleOpenAIResults } from "./routes/openai-results";
import { handlePerplexityResults } from "./routes/perplexity-results";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Claude results endpoint
  app.post("/api/claude/results", handleClaudeResults);
  // Gemini results endpoint
  app.post("/api/gemini/results", handleGeminiResults);
  // OpenAI results endpoint
  app.post("/api/openai/results", handleOpenAIResults);
  // Perplexity results endpoint
  app.post("/api/perplexity/results", handlePerplexityResults);

  return app;
}
