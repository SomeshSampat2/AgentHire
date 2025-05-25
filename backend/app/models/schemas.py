from pydantic import BaseModel, EmailStr, HttpUrl
from typing import Optional, List, Dict, Any
from datetime import datetime


class ExperienceItem(BaseModel):
    """Individual experience item"""
    title: str
    company: str
    duration: str
    description: str


class EducationItem(BaseModel):
    """Individual education item"""
    degree: str
    institution: str
    year: str
    gpa: Optional[str] = None


class ProjectItem(BaseModel):
    """Individual project item"""
    name: str
    description: str
    technologies: List[str] = []


class ResumeData(BaseModel):
    """Parsed resume data structure"""
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    education: List[EducationItem] = []
    skills: List[str] = []
    experience: List[ExperienceItem] = []
    certifications: List[str] = []
    languages: List[str] = []
    projects: List[ProjectItem] = []
    summary: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None


class JobDescription(BaseModel):
    """Job description structure"""
    title: str
    company: str
    description: str
    required_skills: List[str] = []
    preferred_skills: List[str] = []
    experience_level: Optional[str] = None
    education_requirements: List[str] = []
    location: Optional[str] = None


class LinkedInProfile(BaseModel):
    """LinkedIn profile data"""
    headline: Optional[str] = None
    summary: Optional[str] = None
    experience: List[Dict[str, str]] = []
    education: List[Dict[str, str]] = []
    skills: List[str] = []
    endorsements: Dict[str, int] = {}
    connections: Optional[int] = None
    certifications: List[str] = []


class GitHubProfile(BaseModel):
    """GitHub profile data"""
    username: str
    name: Optional[str] = None
    bio: Optional[str] = None
    public_repos: int = 0
    followers: int = 0
    following: int = 0
    repositories: List[Dict[str, Any]] = []
    languages: Dict[str, int] = {}
    contribution_stats: Dict[str, Any] = {}
    top_repositories: List[Dict[str, Any]] = []


class ProfileEnrichment(BaseModel):
    """Combined profile enrichment data"""
    linkedin: Optional[LinkedInProfile] = None
    github: Optional[GitHubProfile] = None
    portfolio: Optional[Dict[str, Any]] = None


class ScoreBreakdown(BaseModel):
    """Scoring breakdown structure"""
    resume_match: float
    linkedin_score: float = 0.0
    github_score: float = 0.0
    portfolio_score: float = 0.0
    total_score: float
    explanation: str


class CandidateAnalysis(BaseModel):
    """Complete candidate analysis result"""
    candidate_name: Optional[str] = None
    resume_data: ResumeData
    job_description: JobDescription
    profile_enrichment: Optional[ProfileEnrichment] = None
    score_breakdown: ScoreBreakdown
    recommendations: List[str] = []
    red_flags: List[str] = []
    analysis_timestamp: datetime


class UploadResumeRequest(BaseModel):
    """Request schema for resume upload"""
    job_description: Optional[JobDescription] = None


class UploadResumeResponse(BaseModel):
    """Response schema for resume upload"""
    success: bool
    message: str
    file_id: str
    resume_data: Optional[ResumeData] = None


class AnalyzeCandidateRequest(BaseModel):
    """Request schema for candidate analysis"""
    file_id: str
    job_description: JobDescription
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None


class AnalyzeCandidateResponse(BaseModel):
    """Response schema for candidate analysis"""
    success: bool
    message: str
    analysis: Optional[CandidateAnalysis] = None


class EnrichProfileRequest(BaseModel):
    """Request schema for profile enrichment"""
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None


class EnrichProfileResponse(BaseModel):
    """Response schema for profile enrichment"""
    success: bool
    message: str
    enrichment: Optional[ProfileEnrichment] = None


class ErrorResponse(BaseModel):
    """Standard error response"""
    success: bool = False
    message: str
    error_code: Optional[str] = None
    details: Optional[Dict[str, Any]] = None 