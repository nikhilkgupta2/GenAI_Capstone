#!/usr/bin/env python3
"""Verify Gemini API setup and test connection."""

import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_dir))

def check_env():
    """Check if .env file has required variables."""
    env_file = backend_dir / ".env"
    if not env_file.exists():
        print("❌ backend/.env not found")
        return False
    
    content = env_file.read_text()
    
    if "GEMINI_API_KEY=" not in content:
        print("❌ GEMINI_API_KEY not in .env")
        return False
    
    if "GEMINI_API_KEY=your-gemini-api-key-here" in content:
        print("⚠️  GEMINI_API_KEY is still placeholder")
        print("   Get your key from: https://aistudio.google.com/app/apikey")
        return False
    
    print("✅ GEMINI_API_KEY found in .env")
    return True

def check_dependencies():
    """Check if google-generativeai is installed."""
    try:
        import google.generativeai as genai
        print("✅ google-generativeai package installed")
        return True
    except ImportError:
        print("❌ google-generativeai not installed")
        print("   Run: pip install -r backend/requirements.txt")
        return False

def test_api_connection():
    """Test Gemini API connection."""
    try:
        from app.core.config import settings
        import google.generativeai as genai
        
        if not settings.gemini_api_key or settings.gemini_api_key == "your-gemini-api-key-here":
            print("⚠️  GEMINI_API_KEY not configured")
            return False
        
        genai.configure(api_key=settings.gemini_api_key)
        model = genai.GenerativeModel(model_name=settings.gemini_model)
        
        print(f"🔄 Testing connection with model: {settings.gemini_model}")
        response = model.generate_content("Say 'Hello' in one word")
        
        if response.text:
            print(f"✅ API connection successful!")
            print(f"   Response: {response.text.strip()}")
            return True
        else:
            print("❌ API returned empty response")
            return False
            
    except Exception as e:
        print(f"❌ API connection failed: {str(e)}")
        return False

def main():
    """Run all checks."""
    print("🔍 Verifying Gemini API Setup")
    print("=" * 50)
    print()
    
    checks = [
        ("Environment Configuration", check_env),
        ("Dependencies", check_dependencies),
        ("API Connection", test_api_connection),
    ]
    
    results = []
    for name, check_func in checks:
        print(f"Checking {name}...")
        result = check_func()
        results.append(result)
        print()
    
    print("=" * 50)
    if all(results):
        print("✅ All checks passed! Gemini API is ready to use.")
        print()
        print("🚀 Start the backend:")
        print("   cd backend")
        print("   uvicorn app.main:app --reload")
        return 0
    else:
        print("❌ Some checks failed. Please fix the issues above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
