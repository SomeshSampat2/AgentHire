#!/usr/bin/env python3
"""
Simple startup script for HireAgent backend
"""
import os
import sys
import subprocess

def main():
    print("🚀 Starting HireAgent Backend...")
    
    # Change to backend directory
    backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
    os.chdir(backend_dir)
    print(f"📁 Working directory: {os.getcwd()}")
    
    # Check if virtual environment exists
    venv_path = os.path.join(backend_dir, 'venv')
    if not os.path.exists(venv_path):
        print("❌ Virtual environment not found!")
        return 1
    
    # Check if .env file exists
    env_path = os.path.join(backend_dir, '.env')
    if not os.path.exists(env_path):
        print("❌ .env file not found!")
        return 1
    
    print("✅ Environment setup looks good")
    
    # Activate virtual environment and run server
    if sys.platform == "win32":
        python_path = os.path.join(venv_path, 'Scripts', 'python.exe')
        uvicorn_path = os.path.join(venv_path, 'Scripts', 'uvicorn.exe')
    else:
        python_path = os.path.join(venv_path, 'bin', 'python')
        uvicorn_path = os.path.join(venv_path, 'bin', 'uvicorn')
    
    print(f"🐍 Using Python: {python_path}")
    print(f"🦄 Using Uvicorn: {uvicorn_path}")
    
    # Test import first
    print("🧪 Testing app import...")
    try:
        result = subprocess.run([
            python_path, '-c', 
            'from app.main import app; print("✅ App imported successfully")'
        ], capture_output=True, text=True, timeout=30)
        
        if result.returncode != 0:
            print("❌ App import failed:")
            print(result.stderr)
            return 1
        else:
            print(result.stdout.strip())
    except subprocess.TimeoutExpired:
        print("❌ App import timed out")
        return 1
    
    # Start the server
    print("🚀 Starting Uvicorn server...")
    try:
        subprocess.run([
            uvicorn_path, 'app.main:app', 
            '--host', '127.0.0.1', 
            '--port', '8000',
            '--reload'
        ])
    except KeyboardInterrupt:
        print("\n👋 Server stopped by user")
    except Exception as e:
        print(f"❌ Server error: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main()) 