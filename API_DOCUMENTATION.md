# HireAgent API Documentation

This document provides detailed information about the HireAgent API endpoints.

## Base URL

- **Development**: `http://localhost:8000`
- **Production**: Your deployed backend URL

## Authentication

Currently, the API does not require authentication. In a production environment, you should implement proper authentication and authorization.

## API Endpoints

### Health Check

#### GET `/health`

Check if the API is running and healthy.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

---

### Resume Upload

#### POST `/api/upload-resume`

Upload and parse a resume file (PDF, DOCX, or TXT).

**Request:**
- **Content-Type**: `multipart/form-data`
- **Body**: Form data with file field

**Example:**
```bash
curl -X POST \
  http://localhost:8000/api/upload-resume \
  -F "file=@resume.pdf"
```

**Response:**
```json
{
  "success": true,
  "message": "Resume uploaded and parsed successfully",
  "file_id": "uuid-string",
  "resume_data": {
    "name": "John Doe",
    "email": "john.doe@email.com",
    "phone": "(555) 123-4567",
    "education": ["Bachelor of Science in Computer Science"],
    "skills": ["Python", "JavaScript", "React"],
    "experience": ["Senior Software Engineer at Tech Corp"],
    "certifications": ["AWS Certified Solutions Architect"],
    "languages": ["English", "Spanish"],
    "summary": "Experienced software engineer...",
    "linkedin_url": "https://linkedin.com/in/johndoe",
    "github_url": "https://github.com/johndoe",
    "portfolio_url": "https://johndoe.dev"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "File type not allowed. Supported types: pdf,docx,txt"
}
```

---

### Candidate Analysis

#### POST `/api/analyze-candidate`

Analyze a candidate's suitability for a job position.

**Request:**
```json
{
  "file_id": "uuid-string",
  "job_description": {
    "title": "Senior Software Engineer",
    "company": "Tech Corp",
    "description": "We are looking for a senior software engineer...",
    "required_skills": ["Python", "React", "AWS"],
    "preferred_skills": ["Docker", "Kubernetes"],
    "experience_level": "Senior",
    "education_requirements": ["Bachelor's degree in Computer Science"],
    "location": "San Francisco, CA"
  },
  "linkedin_url": "https://linkedin.com/in/johndoe",
  "github_url": "https://github.com/johndoe",
  "portfolio_url": "https://johndoe.dev"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Candidate analysis completed successfully",
  "analysis": {
    "candidate_name": "John Doe",
    "resume_data": { /* Resume data object */ },
    "job_description": { /* Job description object */ },
    "profile_enrichment": {
      "linkedin": {
        "headline": "Senior Software Engineer",
        "summary": "Experienced developer...",
        "experience": [],
        "education": [],
        "skills": [],
        "endorsements": {},
        "connections": 500,
        "certifications": []
      },
      "github": {
        "username": "johndoe",
        "name": "John Doe",
        "bio": "Software engineer passionate about...",
        "public_repos": 25,
        "followers": 100,
        "following": 50,
        "repositories": [],
        "languages": {"Python": 15, "JavaScript": 10},
        "contribution_stats": {},
        "top_repositories": []
      },
      "portfolio": {
        "url": "https://johndoe.dev",
        "title": "John Doe - Portfolio",
        "description": "Personal portfolio website",
        "technologies": ["React", "Node.js"],
        "projects": [],
        "contact_info": {},
        "meta_tags": {}
      }
    },
    "score_breakdown": {
      "resume_match": 85.0,
      "linkedin_score": 15.0,
      "github_score": 12.0,
      "portfolio_score": 8.0,
      "total_score": 120.0,
      "explanation": "Strong candidate with excellent technical skills..."
    },
    "recommendations": [
      "Consider for technical interview",
      "Strong background in required technologies"
    ],
    "red_flags": [],
    "analysis_timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

---

### Profile Enrichment

#### POST `/api/enrich-profile`

Enrich a candidate's profile by scraping social media URLs.

**Request:**
```json
{
  "linkedin_url": "https://linkedin.com/in/johndoe",
  "github_url": "https://github.com/johndoe",
  "portfolio_url": "https://johndoe.dev"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile enrichment completed successfully",
  "enrichment": {
    "linkedin": { /* LinkedIn profile data */ },
    "github": { /* GitHub profile data */ },
    "portfolio": { /* Portfolio data */ }
  }
}
```

---

### Job Description Validation

#### POST `/api/validate-job-description`

Validate a job description format and content.

**Request:**
```json
{
  "title": "Senior Software Engineer",
  "company": "Tech Corp",
  "description": "We are looking for a senior software engineer with experience in Python, React, and cloud technologies. The ideal candidate will have 5+ years of experience building scalable web applications.",
  "required_skills": ["Python", "React", "AWS"],
  "preferred_skills": ["Docker", "Kubernetes", "PostgreSQL"],
  "experience_level": "Senior",
  "education_requirements": ["Bachelor's degree in Computer Science or related field"],
  "location": "San Francisco, CA"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Job description is valid",
  "details": {
    "title": "Senior Software Engineer",
    "company": "Tech Corp",
    "description_length": 150,
    "required_skills_count": 3,
    "preferred_skills_count": 3
  }
}
```

---

### File Cleanup

#### DELETE `/api/cleanup-file/{file_id}`

Clean up an uploaded file by its ID.

**Response:**
```json
{
  "success": true,
  "message": "File cleaned up successfully"
}
```

#### POST `/api/bulk-cleanup`

Clean up old uploaded files.

**Query Parameters:**
- `max_age_hours` (optional): Maximum age in hours (default: 24)

**Response:**
```json
{
  "success": true,
  "message": "Cleaned up 5 old files",
  "deleted_count": 5
}
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error_code": "ERROR_CODE",
  "details": {
    "additional": "error details"
  }
}
```

### Common HTTP Status Codes

- `200 OK`: Request successful
- `400 Bad Request`: Invalid request data
- `404 Not Found`: Resource not found
- `422 Unprocessable Entity`: Validation error
- `500 Internal Server Error`: Server error

## Rate Limiting

Currently, there are no rate limits implemented. In production, consider implementing rate limiting to prevent abuse.

## File Upload Limits

- **Maximum file size**: 10MB
- **Allowed file types**: PDF, DOCX, TXT
- **File retention**: Files are automatically cleaned up after 24 hours

## Security Considerations

1. **File Validation**: All uploaded files are validated for type and size
2. **Path Traversal Protection**: Filenames are sanitized to prevent path traversal attacks
3. **Content Sanitization**: File content is processed safely
4. **CORS**: Configured for specific origins only

## Examples

### Complete Workflow Example

```bash
# 1. Upload resume
curl -X POST \
  http://localhost:8000/api/upload-resume \
  -F "file=@resume.pdf"

# Response: {"file_id": "abc123", ...}

# 2. Analyze candidate
curl -X POST \
  http://localhost:8000/api/analyze-candidate \
  -H "Content-Type: application/json" \
  -d '{
    "file_id": "abc123",
    "job_description": {
      "title": "Software Engineer",
      "company": "Tech Corp",
      "description": "Looking for a software engineer...",
      "required_skills": ["Python", "React"],
      "preferred_skills": ["AWS"],
      "experience_level": "Mid",
      "education_requirements": ["Bachelor degree"],
      "location": "Remote"
    },
    "github_url": "https://github.com/username"
  }'

# 3. Clean up file (optional)
curl -X DELETE \
  http://localhost:8000/api/cleanup-file/abc123
```

## Interactive API Documentation

When the backend is running, you can access interactive API documentation at:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

These interfaces allow you to test the API endpoints directly from your browser. 

# Option 1: Local Development
cd backend && source venv/bin/activate && uvicorn app.main:app --reload
cd frontend && npm run dev

# Option 2: Docker (Recommended)
export GEMINI_API_KEY=your_key_here
docker-compose up --build 