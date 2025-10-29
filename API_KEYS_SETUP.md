# Complete API Keys Configuration for Netlify

## 🔑 All API Keys Required for GeoSight

### Current API Keys Status:
✅ **ANTHROPIC_API_KEY**: sk-ant-api03-CHYqKOr... (Claude 4.5 Sonnet)
✅ **OPENAI_API_KEY**: sk-proj-lcvfoAop6e4f... (ChatGPT)
✅ **GEMINI_API_KEY**: AIzaSyC_8Xqe31ca18pO... (Google Gemini)
✅ **OPENROUTER_API_KEY**: sk-or-v1-3b1e6264d2b... (Perplexity)

## 🚀 Netlify Environment Variables Setup

### Step 1: Go to Netlify Dashboard
1. Visit: https://app.netlify.com/
2. Find your site: **geositev2** (ID: 0fb7e521-1c34-4e23-8198-fd62a6c782a0)

### Step 2: Add Environment Variables
Go to **Site Settings** → **Environment Variables** → **Add Variable**

Add these 4 environment variables:

```
ANTHROPIC_API_KEY = sk-ant-api03-CHYqKOrYOUR_FULL_ANTHROPIC_KEY
OPENAI_API_KEY = sk-proj-lcvfoAop6e4fYOUR_FULL_OPENAI_KEY  
GEMINI_API_KEY = AIzaSyC_8Xqe31ca18pOYOUR_FULL_GEMINI_KEY
OPENROUTER_API_KEY = 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
```

### Step 3: Deploy
**Option A - Drag & Drop:**
- Drag the `dist/spa` folder to Netlify deploy area

**Option B - GitHub Integration:**
- Connect GitHub repository: `trueinf/geosight`
- Build command: `npm run build:client`
- Publish directory: `dist/spa`
- Deploy automatically

## ✅ What Each API Key Does:

1. **ANTHROPIC_API_KEY**: Powers Claude 4.5 Sonnet responses
2. **OPENAI_API_KEY**: Powers ChatGPT/GPT-4 responses  
3. **GEMINI_API_KEY**: Powers Google Gemini responses
4. **OPENROUTER_API_KEY**: Powers Perplexity AI responses

## 🎯 Result:
Your GeoSight application with all AI providers will be live at:
**https://geositev2.netlify.app/**

## 🔧 Troubleshooting:
- Ensure all 4 environment variables are set
- Check that API keys are valid and active
- Verify build completes successfully
- Make sure no extra spaces in environment variable values
