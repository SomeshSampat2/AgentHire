import logging
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Form
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


@router.options("/comprehensive-analysis")
async def comprehensive_analysis_options():
    """Handle CORS preflight for comprehensive analysis endpoint"""
    return {"message": "OK"}


@router.post("/comprehensive-analysis")
async def comprehensive_analysis(
    file: UploadFile = File(...),
    job_description: str = Form(...)
):
    """
    Single endpoint for comprehensive candidate analysis
    - Upload resume and job description text (REQUIRED)
    - AI analyzes candidate against specific job requirements
    - Performs complete analysis with scoring based on job description
    """
    try:
        logger.info(f"Starting comprehensive analysis for file: {file.filename}, job_description length: {len(job_description)}")
        
        # Validate required job description
        if not job_description.strip():
            raise HTTPException(
                status_code=400, 
                detail="Job description is required for accurate candidate analysis"
            )
        
        if len(job_description.strip()) < 50:
            raise HTTPException(
                status_code=400, 
                detail="Job description must be at least 50 characters long for meaningful analysis"
            )
        
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
        
        # Step 3: Parse job description text using AI
        logger.info("Parsing job description text with AI...")
        try:
            job_description_parsed = await gemini_service.parse_job_description_text(job_description.strip())
        except Exception as e:
            logger.error(f"Failed to parse job description: {str(e)}")
            file_service.cleanup_file(file_id)
            raise HTTPException(
                status_code=400, 
                detail=f"Failed to parse job description: {str(e)}. Please provide a more detailed job description."
            )

        # Step 4: Perform comprehensive analysis based on job description
        logger.info("Performing comprehensive AI analysis...")
        try:
            analysis_result = await gemini_service.comprehensive_candidate_analysis(
                resume_data=resume_data,
                job_description=job_description_parsed,
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
            resume_match=analysis_result["score_breakdown"].get("required_skills_match", 0),
            linkedin_score=0.0,  # Removed profile enrichment
            github_score=0.0,    # Removed profile enrichment
            portfolio_score=0.0, # Removed profile enrichment
            total_score=analysis_result["overall_score"],
            explanation=analysis_result.get("detailed_job_fit_analysis", "Analysis completed")
        )

        candidate_analysis = CandidateAnalysis(
            candidate_name=resume_data.name or "Unknown Candidate",
            resume_data=resume_data,
            job_description=job_description_parsed,
            profile_enrichment=None,  # Removed profile enrichment
            score_breakdown=score_breakdown,
            recommendations=analysis_result.get("interview_focus_areas", []),
            red_flags=analysis_result.get("red_flags_for_this_role", []),
            analysis_timestamp=datetime.now()
        )

        # Clean up uploaded file
        file_service.cleanup_file(file_id)

        return {
            "success": True,
            "message": f"Comprehensive analysis completed for {job_description_parsed.title} position",
            "analysis": candidate_analysis,
            "analysis_details": {
                "job_specific_scoring": analysis_result.get("score_breakdown", {}),
                "skills_analysis": analysis_result.get("skills_analysis", {}),
                "strengths_for_role": analysis_result.get("strengths_for_this_role", []),
                "weaknesses_for_role": analysis_result.get("weaknesses_for_this_role", []),
                "experience_match": analysis_result.get("experience_match_analysis", {}),
                "education_analysis": analysis_result.get("education_analysis", {}),
                "hiring_recommendation": analysis_result.get("hiring_recommendation", {}),
                "interview_focus_areas": analysis_result.get("interview_focus_areas", []),
                "onboarding_recommendations": analysis_result.get("onboarding_recommendations", []),
                "salary_fit_assessment": analysis_result.get("salary_fit_assessment", ""),
                "extracted_social_urls": social_urls
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


@router.get("/debug/api-key-status")
async def debug_api_key_status():
    """Debug endpoint to check API key status"""
    from app.core.config import settings
    try:
        api_key = settings.GEMINI_API_KEY
        is_valid = settings.validate_gemini_api_key()
        return {
            "api_key_configured": bool(api_key),
            "api_key_length": len(api_key) if api_key else 0,
            "api_key_preview": f"{api_key[:10]}..." if api_key and len(api_key) > 10 else "Not set",
            "is_valid_format": is_valid,
            "is_placeholder": api_key == "your_gemini_api_key_here"
        }
    except Exception as e:
        return {"error": str(e)} 