#!/bin/bash

# HireAgent Setup Script
# This script helps you set up the HireAgent application quickly

set -e

echo "🚀 Setting up HireAgent - AI-Powered Hiring Assistant"
echo "=================================================="

# Check if required tools are installed
check_requirements() {
    echo "📋 Checking requirements..."
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        echo "❌ Python 3 is required but not installed."
        exit 1
    fi
    echo "✅ Python 3 found: $(python3 --version)"
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js is required but not installed."
        exit 1
    fi
    echo "✅ Node.js found: $(node --version)"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        echo "❌ npm is required but not installed."
        exit 1
    fi
    echo "✅ npm found: $(npm --version)"
    
    # Check Docker (optional)
    if command -v docker &> /dev/null; then
        echo "✅ Docker found: $(docker --version)"
        DOCKER_AVAILABLE=true
    else
        echo "⚠️  Docker not found (optional for containerized deployment)"
        DOCKER_AVAILABLE=false
    fi
}

# Setup environment variables
setup_env() {
    echo ""
    echo "🔧 Setting up environment variables..."
    
    if [ ! -f "backend/.env" ]; then
        echo "Creating backend/.env file..."
        cat > backend/.env << EOF
# Gemini API Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# File Upload Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
ALLOWED_EXTENSIONS=pdf,docx,txt

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Debug Mode
DEBUG=True

# Gemini Model Configuration
GEMINI_MODEL=gemini-2.5-flash
GEMINI_TEMPERATURE=0.1
GEMINI_MAX_OUTPUT_TOKENS=2048

# Web Scraping Configuration
SCRAPING_TIMEOUT=30
MAX_RETRIES=3
EOF
        echo "✅ Created backend/.env file"
        echo "⚠️  Please edit backend/.env and add your Gemini API key"
    else
        echo "✅ backend/.env already exists"
    fi
}

# Setup backend
setup_backend() {
    echo ""
    echo "🐍 Setting up backend..."
    
    cd backend
    
    # Create virtual environment
    if [ ! -d "venv" ]; then
        echo "Creating Python virtual environment..."
        python3 -m venv venv
        echo "✅ Virtual environment created"
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Install dependencies
    echo "Installing Python dependencies..."
    pip install --upgrade pip
    pip install -r requirements.txt
    echo "✅ Backend dependencies installed"
    
    cd ..
}

# Setup frontend
setup_frontend() {
    echo ""
    echo "⚛️  Setting up frontend..."
    
    cd frontend
    
    # Install dependencies
    echo "Installing Node.js dependencies..."
    npm install
    echo "✅ Frontend dependencies installed"
    
    cd ..
}

# Create sample files
create_samples() {
    echo ""
    echo "📄 Creating sample files..."
    
    # Create sample resume
    mkdir -p samples
    cat > samples/sample_resume.txt << EOF
John Doe
Senior Software Engineer
Email: john.doe@email.com
Phone: (555) 123-4567
LinkedIn: https://linkedin.com/in/johndoe
GitHub: https://github.com/johndoe

SUMMARY
Experienced software engineer with 5+ years of experience in full-stack development.
Proficient in Python, JavaScript, React, and cloud technologies.

EDUCATION
Bachelor of Science in Computer Science
University of Technology, 2018

EXPERIENCE
Senior Software Engineer | Tech Solutions Inc. | 2021 - Present
- Developed scalable web applications using Python and React
- Implemented microservices architecture on AWS
- Led a team of 3 junior developers

Software Engineer | StartupCo | 2019 - 2021
- Built RESTful APIs using Django and FastAPI
- Developed responsive frontend applications with React
- Worked with PostgreSQL and Redis databases

SKILLS
Programming Languages: Python, JavaScript, TypeScript, Java
Frameworks: React, Django, FastAPI, Node.js
Cloud: AWS, Docker, Kubernetes
Databases: PostgreSQL, MongoDB, Redis

CERTIFICATIONS
AWS Certified Solutions Architect
EOF
    
    echo "✅ Sample resume created at samples/sample_resume.txt"
}

# Display usage instructions
show_usage() {
    echo ""
    echo "🎉 Setup completed successfully!"
    echo ""
    echo "📝 Next steps:"
    echo "1. Get a Gemini API key from https://ai.google.dev/"
    echo "2. Edit backend/.env and add your GEMINI_API_KEY"
    echo ""
    echo "🚀 To run the application:"
    echo ""
    echo "Option 1 - Local Development:"
    echo "  # Terminal 1 - Start backend"
    echo "  cd backend"
    echo "  source venv/bin/activate"
    echo "  uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
    echo ""
    echo "  # Terminal 2 - Start frontend"
    echo "  cd frontend"
    echo "  npm run dev"
    echo ""
    echo "  # Then open http://localhost:3000"
    echo ""
    
    if [ "$DOCKER_AVAILABLE" = true ]; then
        echo "Option 2 - Docker (recommended):"
        echo "  # Make sure to set GEMINI_API_KEY in your environment"
        echo "  export GEMINI_API_KEY=your_api_key_here"
        echo "  docker-compose up --build"
        echo ""
        echo "  # Then open http://localhost:3000"
        echo ""
    fi
    
    echo "🧪 To test the backend:"
    echo "  python3 test_backend.py"
    echo ""
    echo "📚 For more information, see README.md"
}

# Main execution
main() {
    check_requirements
    setup_env
    setup_backend
    setup_frontend
    create_samples
    show_usage
}

# Run main function
main 