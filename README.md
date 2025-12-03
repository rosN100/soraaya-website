# Soraaya Website - Setup Instructions

## ⚠️ Important: Add Your OpenAI API Key

Before running the website, you need to add your OpenAI API key:

1. **Get your API key:**
   - Go to https://platform.openai.com/api-keys
   - Click "Create new secret key"
   - Copy the key (starts with `sk-`)

2. **Add to `.env.local`:**
   ```bash
   # Open the file
   nano .env.local
   
   # Replace with your actual key
   OPENAI_API_KEY=sk-your-actual-key-here
   
   # Save and exit (Ctrl+X, then Y, then Enter)
   ```

## Running Locally

```bash
# Start development server
npm run dev

# Open in browser
# Visit: http://localhost:3000
```

## Testing the AI Chatbot

1. Type a question like "What does Soraaya do?"
2. Watch the response stream in word-by-word
3. Ask follow-up questions to test conversation memory
4. Try voice input (click microphone icon)

## Deploying to Vercel

```bash
# Install Vercel CLI globally (one-time)
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
npm run deploy

# Follow prompts:
# - Link to existing project? No
# - Project name: soraaya-website
# - Directory: ./
```

### Add Environment Variable to Vercel

After deploying:
1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add: `OPENAI_API_KEY` = `your-key-here`
5. Redeploy for changes to take effect

## Monitoring Costs

1. **OpenAI Dashboard:**
   - Visit https://platform.openai.com/usage
   - Set monthly budget limit ($10 recommended)
   - Enable email alerts

2. **Vercel Analytics:**
   - Check dashboard for traffic
   - Monitor function invocations

## Troubleshooting

**"API key not found" error:**
- Make sure `.env.local` exists and has your key
- Restart dev server after adding key

**Streaming not working:**
- Check browser console for errors
- Ensure you're using Chrome or Edge
- Verify API key is valid

**High costs:**
- Check conversation logs in browser console
- Verify max_tokens limit (500) in api/chat.js
- Consider using GPT-3.5-turbo instead of GPT-4o-mini

## Next Steps

- Test thoroughly in development
- Deploy to Vercel
- Monitor usage for first week
- Refine system prompt based on conversations
- Consider adding PostHog analytics later

---

**Need help?** Check the implementation_plan.md for detailed architecture info.
