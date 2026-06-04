# 🚀 Quick Start: Gemini API Setup

## Your To-Do List (5 minutes)

### 1️⃣ Get API Key
Visit: **https://aistudio.google.com/app/apikey**
- Sign in with Google
- Click "Create API Key"
- Copy the key (starts with `AIza...`)

### 2️⃣ Add to .env
```bash
# Edit backend/.env
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX  # Your actual key
GEMINI_MODEL=gemini-2.0-flash-exp
```

### 3️⃣ Install & Run
```bash
cd backend
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### 4️⃣ Test
```bash
# In another terminal
cd GenAI_Capstone
python verify_gemini.py
```

## Or Use Automated Setup
```bash
cd GenAI_Capstone
./setup_gemini.sh
```

## What Changed?
- ✅ Backend code updated (already done)
- ✅ OpenAI → Gemini API
- ✅ Frontend works as-is (no changes needed)
- ✅ Same features, better performance, lower cost

## Files You Need to Check
```
backend/.env              ← Add your GEMINI_API_KEY here
```

## Files Created for You
```
IMPLEMENTATION_SUMMARY.md  ← Full details
GEMINI_MIGRATION.md        ← Migration guide
setup_gemini.sh            ← Automated setup
verify_gemini.py           ← Test your setup
backend/.env.example       ← Template
```

## Troubleshooting

**"AI is not configured"**
→ Add GEMINI_API_KEY to backend/.env

**"API key not valid"**
→ Check key at https://aistudio.google.com/app/apikey

**"Module not found: google.generativeai"**
→ Run: `pip install -r requirements.txt`

## Cost
- **Free tier**: 1,500 requests/day
- **Paid**: $0.075 per 1M tokens (~133x cheaper than OpenAI)

## Support
- API Docs: https://ai.google.dev/docs
- Pricing: https://ai.google.dev/pricing
- Get Key: https://aistudio.google.com/app/apikey

---
**That's it!** Just add your API key and you're done. 🎉
