#!/usr/bin/env python3
"""
Test script to verify Google Gemini API key functionality.
Run this script to check if your API key is working properly.
"""

import os
import sys
import json
from dotenv import load_dotenv
import google.generativeai as genai

def test_gemini_api():
    """Test the Gemini API key and basic functionality."""
    
    print("🔍 Testing Google Gemini API Key...")
    print("=" * 50)
    
    # Try to load API key from environment or use hardcoded one
    api_key = None
    
    # First, try to load from .env file
    try:
        script_dir = os.path.dirname(__file__)
        dotenv_path = os.path.join(script_dir, '.env')
        load_dotenv(dotenv_path=dotenv_path, override=True)
        api_key = os.getenv('GEMINI_API_KEY')
        if api_key:
            print("✅ Found API key in .env file")
        else:
            print("⚠️  No API key found in .env file")
    except Exception as e:
        print(f"⚠️  Error loading .env file: {e}")
    
    if not api_key:
        print("❌ No API key available!")
        return False
    
    # Test 1: Configure the API
    try:
        print("\n1️⃣  Testing API configuration...")
        genai.configure(api_key=api_key)
        print("✅ API configuration successful")
    except Exception as e:
        print(f"❌ API configuration failed: {e}")
        return False
    
    # Test 2: Initialize the model
    try:
        print("\n2️⃣  Testing model initialization...")
        model = genai.GenerativeModel('gemini-2.5-flash')
        print(f"✅ Model initialized: {model.model_name}")
    except Exception as e:
        print(f"❌ Model initialization failed: {e}")
        return False
    
    # Test 3: Simple content generation
    try:
        print("\n3️⃣  Testing content generation...")
        prompt = "Hello! Please respond with 'API test successful' if you can see this message."
        response = model.generate_content(prompt)
        
        if not response.parts:
            print("❌ No response parts received")
            return False
        
        response_text = response.text.strip()
        print(f"✅ Content generation successful")
        print(f"📝 Response: {response_text}")
        
    except Exception as e:
        print(f"❌ Content generation failed: {e}")
        return False
    
    # Test 4: Test with a more complex prompt (similar to your app)
    try:
        print("\n4️⃣  Testing complex prompt (similar to your app)...")
        test_prompt = """
        Generate a simple tech stack for a basic web application.
        Return ONLY a valid JSON object with this structure:
        {
          "nodes": [
            {
              "id": "node_react",
              "type": "techNode",
              "position": {"x": 100, "y": 100},
              "data": {
                "label": "React",
                "type": "frontend",
                "details": "Frontend framework"
              }
            }
          ],
          "edges": []
        }
        """
        
        response = model.generate_content(test_prompt)
        
        if not response.parts:
            print("❌ No response for complex prompt")
            return False
        
        response_text = response.text.strip()
        print("✅ Complex prompt test successful")
        
        # Try to parse as JSON
        try:
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1
            if json_start != -1 and json_end != 0:
                json_str = response_text[json_start:json_end]
                parsed_json = json.loads(json_str)
                print("✅ JSON parsing successful")
                print(f"📊 Generated {len(parsed_json.get('nodes', []))} nodes")
            else:
                print("⚠️  Could not extract JSON from response")
        except json.JSONDecodeError as json_e:
            print(f"⚠️  JSON parsing failed: {json_e}")
        
    except Exception as e:
        print(f"❌ Complex prompt test failed: {e}")
        return False
    
    print("\n" + "=" * 50)
    print("🎉 All tests passed! Your Gemini API key is working correctly.")
    print("✅ You can now use the API in your application.")
    return True

def main():
    """Main function to run the API test."""
    try:
        success = test_gemini_api()
        if success:
            sys.exit(0)
        else:
            sys.exit(1)
    except KeyboardInterrupt:
        print("\n\n⏹️  Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 