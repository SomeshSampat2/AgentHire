import logging
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import JSONResponse

from app.models.schemas import (
    UploadResumeResponse, 
    AnalyzeCandidateRequest, 
    AnalyzeCandidateResponse,
    EnrichProfileRequest,
    EnrichProfileResponse,
    ErrorResponse,
    JobDescription,
    CandidateAnalysis,
    ScoreBreakdown
)
from app.services.file_service import file_service
from app.services.gemini_service import gemini_service
from app.services.scraping_service import scraping_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/comprehensive-analysis")
async def comprehensive_analysis(
    file: UploadFile = File(...),
    job_url: str = ""
):
    """
    Single endpoint for comprehensive candidate analysis
    - Upload resume and job description URL
    - AI extracts job requirements and social media URLs
    - Performs complete analysis with scoring
    """
    try:
        logger.info(f"Starting comprehensive analysis for file: {file.filename}, job_url: {job_url}")
        
        # Step 1: Save and extract text from resume
        success, message, file_id = await file_service.save_file(file)
        if not success:
            raise HTTPException(status_code=400, detail=message)

        success, message, resume_text = await file_service.extract_text_from_file(file_id)
        if not success:
            file_service.cleanup_file(file_id)
            raise HTTPException(status_code=400, detail=message)

        # Step 2: Parse resume and extract social media URLs
        logger.info("Parsing resume and extracting URLs...")
        try:
            resume_result = await gemini_service.parse_resume_with_urls(resume_text)
            resume_data = resume_result["resume_data"]
            social_urls = resume_result["social_urls"]
        except Exception as e:
            if "API_KEY_INVALID" in str(e) or "API key not valid" in str(e):
                raise HTTPException(
                    status_code=400, 
                    detail="Invalid Gemini API key. Please check your API key configuration."
                )
            raise HTTPException(status_code=500, detail=f"Failed to parse resume: {str(e)}")
        
        # Step 3: Extract job description from URL
        job_description = None
        if job_url.strip():
            logger.info(f"Extracting job description from URL: {job_url}")
            try:
                job_description = await gemini_service.extract_job_description_from_url(job_url)
            except Exception as e:
                logger.warning(f"Failed to extract job description from URL: {str(e)}")
                # Continue with a basic job description
                job_description = JobDescription(
                    title="Position Analysis",
                    company="Unknown Company",
                    description="Job description could not be extracted from the provided URL. Manual review recommended.",
                    required_skills=[],
                    preferred_skills=[],
                    experience_level="",
                    education_requirements=[],
                    location=""
                )
        else:
            # Default job description if no URL provided
            job_description = JobDescription(
                title="General Analysis",
                company="No Company Specified",
                description="General resume analysis without specific job requirements.",
                required_skills=[],
                preferred_skills=[],
                experience_level="",
                education_requirements=[],
                location=""
            )

        # Step 4: Perform comprehensive analysis
        logger.info("Performing comprehensive AI analysis...")
        try:
            analysis_result = await gemini_service.comprehensive_candidate_analysis(
                resume_data=resume_data,
                job_description=job_description,
                profile_enrichment=None
            )
        except Exception as e:
            if "API_KEY_INVALID" in str(e) or "API key not valid" in str(e):
                raise HTTPException(
                    status_code=400, 
                    detail="Invalid Gemini API key. Please check your API key configuration in backend/.env file."
                )
            raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

        # Step 5: Structure the response
        score_breakdown = ScoreBreakdown(
            resume_match=analysis_result["score_breakdown"]["resume_match"],
            linkedin_score=0.0,  # Removed profile enrichment
            github_score=0.0,    # Removed profile enrichment
            portfolio_score=0.0, # Removed profile enrichment
            total_score=analysis_result["overall_score"],
            explanation=analysis_result["detailed_analysis"]
        )

        candidate_analysis = CandidateAnalysis(
            candidate_name=resume_data.name or "Unknown Candidate",
            resume_data=resume_data,
            job_description=job_description,
            profile_enrichment=None,  # Removed profile enrichment
            score_breakdown=score_breakdown,
            recommendations=analysis_result.get("hr_recommendations", []),  # Updated field name
            red_flags=analysis_result.get("red_flags", []),
            analysis_timestamp=datetime.now()
        )

        # Clean up uploaded file
        file_service.cleanup_file(file_id)

        return {
            "success": True,
            "message": "Comprehensive analysis completed successfully",
            "analysis": candidate_analysis,
            "analysis_details": {
                "strengths": analysis_result.get("strengths", []),
                "weaknesses": analysis_result.get("weaknesses", []),
                "missing_skills": analysis_result.get("missing_skills", []),
                "fit_assessment": analysis_result.get("fit_assessment", "UNKNOWN"),
                "suggested_interview_questions": analysis_result.get("suggested_interview_questions", [])  # Updated field name
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in comprehensive analysis: {str(e)}")
        # Clean up file if it exists
        if 'file_id' in locals():
            file_service.cleanup_file(file_id)
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.post("/upload-resume", response_model=UploadResumeResponse)
async def upload_resume(file: UploadFile = File(...)):
    """Upload and parse a resume file (legacy endpoint)"""
    try:
        # Save the uploaded file
        success, message, file_id = await file_service.save_file(file)
        if not success:
            raise HTTPException(status_code=400, detail=message)

        # Extract text from the file
        success, message, resume_text = await file_service.extract_text_from_file(file_id)
        if not success:
            file_service.cleanup_file(file_id)
            raise HTTPException(status_code=400, detail=message)

        # Parse resume using Gemini AI
        resume_result = await gemini_service.parse_resume_with_urls(resume_text)
        resume_data = resume_result["resume_data"]

        return UploadResumeResponse(
            success=True,
            message="Resume uploaded and parsed successfully",
            file_id=file_id,
            resume_data=resume_data
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in upload_resume: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error during file upload")


@router.post("/extract-job-from-url")
async def extract_job_from_url(job_url: str):
    """Extract job description from URL"""
    try:
        if not job_url.strip():
            raise HTTPException(status_code=400, detail="Job URL is required")

        job_description = await gemini_service.extract_job_description_from_url(job_url)
        
        return {
            "success": True,
            "message": "Job description extracted successfully",
            "job_description": job_description
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error extracting job from URL: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to extract job description: {str(e)}")


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


@router.post("/validate-job-description")
async def validate_job_description(job_description: JobDescription):
    """Validate job description format and content"""
    try:
        # Basic validation
        if not job_description.title.strip():
            raise HTTPException(status_code=400, detail="Job title is required")
        
        if not job_description.company.strip():
            raise HTTPException(status_code=400, detail="Company name is required")
        
        if not job_description.description.strip():
            raise HTTPException(status_code=400, detail="Job description is required")
        
        if len(job_description.description) < 50:
            raise HTTPException(status_code=400, detail="Job description is too short (minimum 50 characters)")

        return {
            "success": True,
            "message": "Job description is valid",
            "details": {
                "title": job_description.title,
                "company": job_description.company,
                "description_length": len(job_description.description),
                "required_skills_count": len(job_description.required_skills),
                "preferred_skills_count": len(job_description.preferred_skills)
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error validating job description: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error during validation")


@router.delete("/cleanup-file/{file_id}")
async def cleanup_file(file_id: str):
    """Clean up uploaded file"""
    try:
        success = file_service.cleanup_file(file_id)
        if success:
            return {"success": True, "message": "File cleaned up successfully"}
        else:
            raise HTTPException(status_code=404, detail="File not found")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error cleaning up file: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error during file cleanup")


@router.post("/bulk-cleanup")
async def bulk_cleanup(max_age_hours: int = 24):
    """Clean up old uploaded files"""
    try:
        deleted_count = file_service.cleanup_old_files(max_age_hours)
        return {
            "success": True,
            "message": f"Cleaned up {deleted_count} old files",
            "deleted_count": deleted_count
        }

    except Exception as e:
        logger.error(f"Error during bulk cleanup: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error during bulk cleanup") 