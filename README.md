# HireAgent - AI-Powered Hiring Assistant

A comprehensive hiring assistant application that uses Gemini AI to analyze resumes, match candidates to job descriptions, and enrich profiles from social platforms.

## Features

- **Resume Parsing**: Upload and parse resumes in PDF, DOCX, or plain text format
- **Job Matching**: Compare resumes against job descriptions with AI-powered scoring
- **Profile Enrichment**: Scrape and analyze LinkedIn, GitHub, and portfolio sites
- **Suitability Scoring**: Comprehensive candidate evaluation with detailed breakdowns
- **Secure File Handling**: Safe file upload and processing
- **Modern UI**: Clean, responsive interface built with Next.js and Tailwind CSS

## Architecture

- **Backend**: FastAPI with Python
- **Frontend**: Next.js with React and Tailwind CSS
- **AI**: Google Gemini 2.5-flash model
- **Web Scraping**: BeautifulSoup and Playwright
- **Containerization**: Docker for easy deployment

## Project Structure

```
HireAgent/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── core/           # Core functionality
│   │   ├── models/         # Data models
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utility functions
│   ├── uploads/            # File upload directory
│   ├── requirements.txt    # Python dependencies
│   └── Dockerfile         # Backend Docker config
├── frontend/               # Next.js frontend
│   ├── components/         # React components
│   ├── pages/             # Next.js pages
│   ├── styles/            # CSS styles
│   ├── utils/             # Frontend utilities
│   ├── package.json       # Node dependencies
│   └── Dockerfile         # Frontend Docker config
├── docker-compose.yml     # Multi-container setup
└── README.md             # This file
```

## Setup Instructions

### Prerequisites

- Python 3.9+
- Node.js 18+
- Docker (optional)
- Gemini API Key

### Environment Variables

Create a `.env` file in the backend directory:

```env
GEMINI_API_KEY=your_gemini_api_key_here
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760  # 10MB
ALLOWED_EXTENSIONS=pdf,docx,txt
```

### Local Development

#### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Docker Setup

```bash
# Build and run all services
docker-compose up --build

# Run in detached mode
docker-compose up -d
```

## API Endpoints

- `POST /api/upload-resume` - Upload and parse resume
- `POST /api/analyze-candidate` - Analyze candidate suitability
- `POST /api/enrich-profile` - Enrich profile from URLs
- `GET /api/health` - Health check

## Usage

1. Start the application (locally or with Docker)
2. Open http://localhost:3000 in your browser
3. Upload a resume and provide a job description
4. Add LinkedIn/GitHub URLs for profile enrichment
5. Get comprehensive candidate analysis with scoring

## Security Features

- File type validation
- File size limits
- Content sanitization
- Secure file storage
- Input validation and sanitization

## Development

### Adding New Features

1. Backend: Add new routes in `backend/app/api/`
2. Frontend: Add new components in `frontend/components/`
3. Update documentation and tests

### Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

## License

MIT License 