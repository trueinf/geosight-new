# Environment Setup

## Required API Keys

The application requires the following API keys to be set as environment variables:

### 1. OpenAI API Key (for ChatGPT)
- **Variable**: `OPENAI_API_KEY`
- **Get from**: https://platform.openai.com/api-keys
- **Usage**: ChatGPT results

### 2. Anthropic API Key (for Claude)
- **Variable**: `ANTHROPIC_API_KEY`
- **Get from**: https://console.anthropic.com/
- **Usage**: Claude results

### 3. Google Gemini API Key
- **Variable**: `GEMINI_API_KEY`
- **Get from**: https://makersuite.google.com/app/apikey
- **Usage**: Gemini results

### 4. OpenRouter API Key (for Perplexity)
- **Variable**: `OPENROUTER_API_KEY`
- **Get from**: https://openrouter.ai/keys
- **Usage**: Perplexity results

## Setup Instructions

1. Create a `.env` file in the root directory
2. Add the following content (replace with your actual API keys):

```env
# API Keys for AI Providers
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Optional: Site configuration
SITE_URL=https://geosight.app
SITE_NAME=GeoSight
PING_MESSAGE=pong
```

3. Restart the server after adding the environment variables

## Current Issue

**Perplexity is returning 0 results because `OPENROUTER_API_KEY` is not set.**

The server logs will show:
- ❌ OPENROUTER_API_KEY is not set in environment variables
- This causes the Perplexity API to fail and return 0 results

## Solution

Add the `OPENROUTER_API_KEY` to your `.env` file and restart the server.


