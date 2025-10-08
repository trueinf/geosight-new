import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleClaudeResults } from "./routes/claude-results";
import { handleGeminiResults } from "./routes/gemini-results";
import { handleOpenAIResults } from "./routes/openai-results";
import { handlePerplexityResults } from "./routes/perplexity-results";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
    app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  // Debug middleware
  app.use((req, res, next) => {
    console.log('🔍 Request:', { method: req.method, url: req.url, body: req.body });
    next();
  });

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  // Test endpoint to verify function is working
  app.post("/api/test", (req, res) => {
    console.log('🔍 Test endpoint hit:', { body: req.body, headers: req.headers });
    res.json({ 
      message: "Test endpoint working", 
      body: req.body,
      hasBody: !!req.body,
      bodyKeys: req.body ? Object.keys(req.body) : []
    });
  });

  // Debug endpoint for Perplexity
  app.post("/api/perplexity/debug", (req, res) => {
    console.log('🔍 Perplexity debug endpoint hit:', { 
      body: req.body, 
      bodyType: typeof req.body,
      bodyString: JSON.stringify(req.body),
      headers: req.headers 
    });
    res.json({ 
      message: "Perplexity debug working", 
      body: req.body,
      hasBody: !!req.body,
      bodyKeys: req.body ? Object.keys(req.body) : [],
      envCheck: {
        hasOpenRouterKey: !!process.env.OPENROUTER_API_KEY,
        keyLength: process.env.OPENROUTER_API_KEY?.length || 0
      }
    });
  });


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
