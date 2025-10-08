// @ts-ignore - Netlify functions types
import { Handler } from '@netlify/functions';
import { createServer } from "../../server";

const app = createServer();

export const handler: Handler = async (event, context) => {
  console.log('🔍 Netlify function called:', { 
    path: event.path, 
    method: event.httpMethod,
    body: event.body,
    headers: event.headers 
  });

  // Handle different routes - try multiple path patterns
  let path = event.path;
  if (path.includes('/.netlify/functions/api')) {
    path = path.replace('/.netlify/functions/api', '');
  }
  console.log('🔍 Processing path:', path);
  
  // Helper function to create req/res objects
  const createReqRes = () => {
    let parsedBody = {};
    try {
      parsedBody = event.body ? JSON.parse(event.body) : {};
    } catch (error) {
      console.error('Failed to parse request body:', error);
      parsedBody = {};
    }
    
    const req = {
      body: parsedBody,
      method: event.httpMethod,
      url: event.path,
      headers: event.headers
    } as any;
    
    let responseData: any = null;
    let statusCode = 200;
    
    const res = {
      status: (code: number) => {
        statusCode = code;
        return res;
      },
      json: (data: any) => {
        responseData = data;
        return res;
      }
    } as any;
    
    return { req, res, getResponse: () => ({ data: responseData, statusCode }) };
  };

  if (path === '/api/claude/results' && event.httpMethod === 'POST') {
    const { handleClaudeResults } = await import('../../server/routes/claude-results');
    const { req, res, getResponse } = createReqRes();
    
    try {
      // Increased timeout to 9.5 seconds to give APIs more time
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Function timeout after 9.5 seconds')), 9500);
      });
      
      const claudePromise = handleClaudeResults(req, res, () => {});
      
      await Promise.race([claudePromise, timeoutPromise]);
      
      const response = getResponse();
      console.log('🔍 Claude response:', response);
      return {
        statusCode: response.statusCode,
        body: JSON.stringify(response.data),
        headers: { 'Content-Type': 'application/json' }
      };
    } catch (error) {
      console.error('🔍 Claude error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: (error as Error).message,
          type: 'claude_timeout_error',
          retry: true
        }),
        headers: { 'Content-Type': 'application/json' }
      };
    }
  }

  if (path === '/api/openai/results' && event.httpMethod === 'POST') {
    const { handleOpenAIResults } = await import('../../server/routes/openai-results');
    const { req, res, getResponse } = createReqRes();
    
    try {
      // Increased timeout to 9.5 seconds to give APIs more time
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Function timeout after 9.5 seconds')), 9500);
      });
      
      const openaiPromise = handleOpenAIResults(req, res, () => {});
      
      await Promise.race([openaiPromise, timeoutPromise]);
      
      const response = getResponse();
      return {
        statusCode: response.statusCode,
        body: JSON.stringify(response.data),
        headers: { 'Content-Type': 'application/json' }
      };
    } catch (error) {
      console.error('🔍 OpenAI function error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: (error as Error).message,
          type: 'openai_timeout_error',
          retry: true
        }),
        headers: { 'Content-Type': 'application/json' }
      };
    }
  }

  if (path === '/api/gemini/results' && event.httpMethod === 'POST') {
    const { handleGeminiResults } = await import('../../server/routes/gemini-results');
    const { req, res, getResponse } = createReqRes();
    
    try {
      // Increased timeout to 9.5 seconds to give APIs more time
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Function timeout after 9.5 seconds')), 9500);
      });
      
      const geminiPromise = handleGeminiResults(req, res, () => {});
      
      await Promise.race([geminiPromise, timeoutPromise]);
      
      const response = getResponse();
      return {
        statusCode: response.statusCode,
        body: JSON.stringify(response.data),
        headers: { 'Content-Type': 'application/json' }
      };
    } catch (error) {
      console.error('🔍 Gemini function error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: (error as Error).message,
          type: 'gemini_timeout_error',
          retry: true
        }),
        headers: { 'Content-Type': 'application/json' }
      };
    }
  }

  if (path === '/api/perplexity/results' && event.httpMethod === 'POST') {
    console.log('🔍 Perplexity function called with:', { path, body: event.body });
    const { handlePerplexityResults } = await import('../../server/routes/perplexity-results');
    const { req, res, getResponse } = createReqRes();
    
    try {
      // Increased timeout to 9.5 seconds to give APIs more time
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Function timeout after 9.5 seconds')), 9500);
      });
      
      console.log('🔍 Calling handlePerplexityResults...');
      const perplexityPromise = handlePerplexityResults(req, res, () => {});
      
      await Promise.race([perplexityPromise, timeoutPromise]);
      
      const response = getResponse();
      console.log('🔍 Perplexity response:', response);
      return {
        statusCode: response.statusCode,
        body: JSON.stringify(response.data),
        headers: { 'Content-Type': 'application/json' }
      };
    } catch (error) {
      console.error('🔍 Perplexity function error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: (error as Error).message,
          stack: (error as Error).stack,
          type: 'perplexity_timeout_error',
          retry: true
        }),
        headers: { 'Content-Type': 'application/json' }
      };
    }
  }

  // Debug: show what path we received
  console.log('🔍 No route matched for path:', path);
  console.log('🔍 Available routes: /api/claude/results, /api/openai/results, /api/gemini/results, /api/perplexity/results');
  
  // Default response
  return {
    statusCode: 404,
    body: JSON.stringify({ 
      error: 'Not found',
      receivedPath: path,
      originalPath: event.path,
      method: event.httpMethod
    }),
    headers: { 'Content-Type': 'application/json' }
  };
};
