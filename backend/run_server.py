#!/usr/bin/env python3
"""
Simple script to run the Flask backend server
"""

import os
import sys

def main():
    print("🚀 Starting Provider Credentialing Analytics API Server...")
    print("📍 Server will be available at: http://localhost:5000")
    print("📊 Health check endpoint: http://localhost:5000/")
    print("📋 Upload endpoints ready for CSV files")
    print("🔄 Processing pipeline endpoints available")
    print("\n" + "="*50)
    
    try:
        # Import and run the Flask app
        from app import app
        app.run(debug=True, host='0.0.0.0', port=5000)
    except ImportError as e:
        print(f"❌ Error importing Flask app: {e}")
        print("Make sure you have installed all dependencies with:")
        print("pip install -r requirements.txt")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()