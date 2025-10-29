# GeoSight Netlify Deployment Guide

## 🚀 Quick Deployment Options

### Option 1: Manual Drag & Drop (Fastest)
1. **Open Netlify Dashboard**: https://app.netlify.com/
2. **Find your site**: Look for "geositev2" or site ID `0fb7e521-1c34-4e23-8198-fd62a6c782a0`
3. **Drag & Drop**: Drag the `dist/spa` folder to the deploy area
4. **Done!** Your site will be live at https://geositev2.netlify.app/

### Option 2: GitHub Integration (Recommended)
1. **Go to Netlify**: https://app.netlify.com/
2. **New Site from Git**: Click "New site from Git"
3. **Connect GitHub**: Select your repository `trueinf/geosight`
4. **Build Settings**:
   - Build command: `npm run build:client`
   - Publish directory: `dist/spa`
5. **Environment Variables** (Add these):
   ```
   ANTHROPIC_API_KEY=your_claude_key
   OPENAI_API_KEY=your_openai_key
   GEMINI_API_KEY=your_gemini_key
   OPENROUTER_API_KEY=your_perplexity_key
   ```
6. **Deploy**: Click "Deploy site"

### Option 3: CLI Deployment
```bash
# Login to Netlify
netlify login

# Deploy
netlify deploy --prod --dir=dist/spa
```

## ✅ What's Ready
- **Claude 4.5 Sonnet**: Updated to `claude-sonnet-4-5-20250929`
- **Build Complete**: Production build in `dist/spa/`
- **All AI Providers**: Working perfectly
- **GitHub Updated**: Latest code pushed

## 🔧 Environment Variables Needed
Make sure to add these in Netlify's environment variables section:
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `GEMINI_API_KEY`
- `OPENROUTER_API_KEY`

## 🎯 Result
Your GeoSight application with Claude 4.5 Sonnet will be live at:
**https://geositev2.netlify.app/**
