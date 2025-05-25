#!/usr/bin/env python3
"""
Simple test script for HireAgent backend API
Run this after starting the backend server to verify functionality
"""

import requests
import json
import os
from pathlib import Path

# Configuration
BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api"

def test_health_check():
    """Test the health check endpoint"""
    print("Testing health check...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Health check passed")
            print(f"Response: {response.json()}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Health check error: {e}")

def test_job_description_validation():
    """Test job description validation"""
    print("\nTesting job description validation...")
    
    job_description = {
        "title": "Senior Software Engineer",
        "company": "Tech Corp",
        "description": "We are looking for a senior software engineer with experience in Python, React, and cloud technologies. The ideal candidate will have 5+ years of experience building scalable web applications.",
        "required_skills": ["Python", "React", "AWS"],
        "preferred_skills": ["Docker", "Kubernetes", "PostgreSQL"],
        "experience_level": "Senior",
        "education_requirements": ["Bachelor's degree in Computer Science or related field"],
        "location": "San Francisco, CA"
    }
    
    try:
        response = requests.post(
            f"{API_URL}/validate-job-description",
            json=job_description,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            print("✅ Job description validation passed")
            print(f"Response: {response.json()}")
        else:
            print(f"❌ Job description validation failed: {response.status_code}")
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"❌ Job description validation error: {e}")

def create_sample_resume():
    """Create a sample resume file for testing"""
    sample_resume = """
John Doe
Software Engineer
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
"""
    
    # Create a temporary resume file
    resume_path = Path("sample_resume.txt")
    with open(resume_path, "w") as f:
        f.write(sample_resume)
    
    return resume_path

def test_resume_upload():
    """Test resume upload functionality"""
    print("\nTesting resume upload...")
    
    # Create sample resume
    resume_path = create_sample_resume()
    
    try:
        with open(resume_path, "rb") as f:
            files = {"file": ("sample_resume.txt", f, "text/plain")}
            response = requests.post(f"{API_URL}/upload-resume", files=files)
        
        if response.status_code == 200:
            print("✅ Resume upload passed")
            result = response.json()
            print(f"File ID: {result.get('file_id')}")
            print(f"Parsed name: {result.get('resume_data', {}).get('name')}")
            return result.get('file_id')
        else:
            print(f"❌ Resume upload failed: {response.status_code}")
            print(f"Error: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Resume upload error: {e}")
        return None
    finally:
        # Clean up
        if resume_path.exists():
            resume_path.unlink()

def test_profile_enrichment():
    """Test profile enrichment functionality"""
    print("\nTesting profile enrichment...")
    
    profile_data = {
        "github_url": "https://github.com/torvalds",
        "linkedin_url": "https://linkedin.com/in/sample",
        "portfolio_url": "https://example.com"
    }
    
    try:
        response = requests.post(
            f"{API_URL}/enrich-profile",
            json=profile_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            print("✅ Profile enrichment passed")
            result = response.json()
            enrichment = result.get('enrichment', {})
            if enrichment.get('github'):
                print(f"GitHub username: {enrichment['github'].get('username')}")
            print("Profile enrichment completed successfully")
        else:
            print(f"❌ Profile enrichment failed: {response.status_code}")
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"❌ Profile enrichment error: {e}")

def main():
    """Run all tests"""
    print("🚀 Starting HireAgent Backend Tests\n")
    
    # Test basic functionality
    test_health_check()
    test_job_description_validation()
    
    # Test file upload
    file_id = test_resume_upload()
    
    # Test profile enrichment
    test_profile_enrichment()
    
    print("\n✨ Tests completed!")
    print("\nNote: Some tests may fail if:")
    print("- Backend server is not running on localhost:8000")
    print("- GEMINI_API_KEY environment variable is not set")
    print("- Network connectivity issues")

if __name__ == "__main__":
    main() 