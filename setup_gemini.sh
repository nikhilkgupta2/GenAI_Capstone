#!/bin/bash

echo "🚀 Gemini API Migration Setup"
echo "=============================="
echo ""

# Check if .env exists
if [ ! -f "backend/.env" ]; then
    echo "❌ backend/.env not found!"
    echo "   Copy from example: cp backend/.env.example backend/.env"
    exit 1
fi

# Check if GEMINI_API_KEY is set
if grep -q "^GEMINI_API_KEY=" backend/.env; then
    echo "✅ GEMINI_API_KEY found in .env"
else
    echo "⚠️  GEMINI_API_KEY not found in .env"
    echo ""
    echo "📝 To get your Gemini API key:"
    echo "   1. Visit: https://aistudio.google.com/app/apikey"
    echo "   2. Sign in with Google"
    echo "   3. Click 'Create API Key'"
    echo "   4. Copy the key (starts with AIza...)"
    echo ""
    read -p "Enter your Gemini API key (or press Enter to skip): " api_key
    
    if [ ! -z "$api_key" ]; then
        echo "" >> backend/.env
        echo "# AI Assistant - Gemini API" >> backend/.env
        echo "GEMINI_API_KEY=$api_key" >> backend/.env
        echo "GEMINI_MODEL=gemini-2.0-flash-exp" >> backend/.env
        echo "✅ Added GEMINI_API_KEY to .env"
    else
        echo "⏭️  Skipped. Add manually to backend/.env:"
        echo "   GEMINI_API_KEY=your-key-here"
        echo "   GEMINI_MODEL=gemini-2.0-flash-exp"
    fi
fi

echo ""
echo "📦 Installing dependencies..."
cd backend
source .venv/bin/activate 2>/dev/null || python -m venv .venv && source .venv/bin/activate
pip install -q -r requirements.txt

echo ""
echo "✅ Setup complete!"
echo ""
echo "🎯 Next steps:"
echo "   1. Ensure GEMINI_API_KEY is in backend/.env"
echo "   2. Start backend: cd backend && uvicorn app.main:app --reload"
echo "   3. Test AI Assistant in the app"
echo ""
echo "📖 See GEMINI_MIGRATION.md for full details"
