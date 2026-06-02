# Migration Guide: OpenAI to Gemini API

## Overview
The AI Assistant has been migrated from OpenAI API to Google Gemini API.

## Changes Made

### Backend Changes

1. **Dependencies** (`requirements.txt`)
   - Removed: `openai>=1.86,<2`
   - Added: `google-generativeai>=0.8.0,<1`

2. **Configuration** (`app/core/config.py`)
   - Removed: `OPENAI_API_KEY`, `OPENAI_MODEL`
   - Added: `GEMINI_API_KEY`, `GEMINI_MODEL`

3. **AI Service** (`app/ai/service.py`)
   - Replaced OpenAI client with Gemini GenerativeModel
   - Updated streaming implementation for Gemini's API
   - Maintained same interface (no breaking changes to routes)

### Environment Variables

**Old:**
```bash
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5
```

**New:**
```bash
GEMINI_API_KEY=AIza...
GEMINI_MODEL=gemini-2.0-flash-exp
```

## What You Need to Do

### 1. Get Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key (starts with `AIza...`)

### 2. Update Your .env File

```bash
cd backend
```

Add to your `.env`:
```bash
GEMINI_API_KEY=AIzaSy...your-actual-key-here
GEMINI_MODEL=gemini-2.0-flash-exp
```

Remove old OpenAI variables:
```bash
# Remove these lines if they exist:
# OPENAI_API_KEY=...
# OPENAI_MODEL=...
```

### 3. Install New Dependencies

```bash
cd backend
source .venv/bin/activate
pip install -r requirements.txt
```

### 4. Restart Backend

```bash
uvicorn app.main:app --reload
```

### 5. Test AI Assistant

1. Open frontend: http://localhost:5173
2. Login to your account
3. Click the AI Assistant button (bottom right)
4. Send a test message like "Show me inventory summary"

## Available Gemini Models

- `gemini-2.0-flash-exp` (default, fastest, recommended)
- `gemini-1.5-pro` (more capable, slower)
- `gemini-1.5-flash` (balanced)

Change model in `.env`:
```bash
GEMINI_MODEL=gemini-1.5-pro
```

## Troubleshooting

### Error: "AI is not configured: GEMINI_API_KEY is missing"
- Check `.env` file has `GEMINI_API_KEY=...`
- Restart backend after adding the key

### Error: "Gemini API error: ..."
- Verify API key is valid at [Google AI Studio](https://aistudio.google.com/app/apikey)
- Check you have API quota remaining
- Ensure model name is correct

### Streaming not working
- Gemini streaming works differently than OpenAI
- Frontend should still receive chunks via Server-Sent Events
- Check browser console for errors

## API Differences

| Feature | OpenAI | Gemini |
|---------|--------|--------|
| System Instructions | `instructions` param | `system_instruction` param |
| Streaming | `stream=True` returns events | `stream=True` returns chunks |
| Response Access | `response.output_text` | `response.text` |
| Error Handling | OpenAI exceptions | Generic exceptions |

## Cost Comparison

Gemini API is generally more cost-effective:
- Gemini 2.0 Flash: Free tier available, then $0.075/1M input tokens
- OpenAI GPT-4: $10/1M input tokens

Check current pricing:
- [Gemini Pricing](https://ai.google.dev/pricing)
- [OpenAI Pricing](https://openai.com/pricing)

## Rollback (if needed)

If you need to rollback to OpenAI:

```bash
cd backend
git checkout HEAD -- requirements.txt app/core/config.py app/ai/service.py
pip install -r requirements.txt
```

Then restore `OPENAI_API_KEY` in `.env`.
