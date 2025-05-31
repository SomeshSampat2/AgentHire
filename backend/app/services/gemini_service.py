import json
import logging
import re
from typing import Dict, List, Optional, Any
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
import requests
from bs4 import BeautifulSoup

from app.core.config import settings
from app.models.schemas import ResumeData, JobDescription, ProfileEnrichment

logger = logging.getLogger(__name__)

class GeminiService:
    def __init__(self):
        """Initialize Gemini service with API key and model configuration"""
        if not settings.validate_gemini_api_key():
            raise ValueError("GEMINI_API_KEY is required and must not be empty")
        
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel('gemini-2.0-flash')
        
        # Safety settings
        self.safety_settings = {
            HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        }

    async def parse_job_description_text(self, job_description_text: str) -> JobDescription:
        """Parse job description from raw text using Gemini analysis"""
        try:
            # Use Gemini to extract structured job description from text
            prompt = f"""
            You are an expert HR analyst. Extract comprehensive job description information from the following job description text and return it in JSON format.
            
            CRITICAL: Be thorough and extract ALL relevant details including technical requirements, soft skills, experience requirements, and qualifications.
            
            Required JSON structure:
            {{
                "title": "Exact job title from posting",
                "company": "Company name (if mentioned, otherwise 'Not specified')",
                "description": "Complete job description including responsibilities, duties, and role overview",
                "required_skills": ["skill1", "skill2", "skill3", ...],
                "preferred_skills": ["preferred_skill1", "preferred_skill2", ...],
                "experience_level": "Entry/Junior/Mid/Senior/Lead/Principal",
                "education_requirements": ["Bachelor's degree", "Master's preferred", "relevant certifications", ...],
                "location": "Job location (remote, hybrid, or specific city) or 'Not specified'",
                "employment_type": "Full-time/Part-time/Contract/Freelance or 'Not specified'",
                "salary_range": "Salary information if available or 'Not specified'",
                "industry": "Industry sector or 'Not specified'",
                "key_responsibilities": ["responsibility1", "responsibility2", ...],
                "technical_requirements": ["technical_req1", "technical_req2", ...],
                "soft_skills": ["communication", "teamwork", "leadership", ...]
            }}
            
            EXTRACTION GUIDELINES:
            1. Extract ALL technical skills, frameworks, programming languages, tools mentioned
            2. Identify both required (must-have) and preferred (nice-to-have) skills
            3. Capture the complete role description and responsibilities
            4. Note experience level requirements (years of experience, seniority level)
            5. Include educational requirements and certifications
            6. Extract soft skills and behavioral requirements
            7. If information is missing, use "Not specified" for strings or empty arrays for lists
            8. Infer job title if not explicitly stated based on responsibilities and requirements
            
            Job Description Text:
            {job_description_text}
            """
            
            response = self.model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    temperature=0.1,
                    max_output_tokens=3000,
                ),
                safety_settings=self.safety_settings
            )
            
            # Parse JSON response with better error handling
            response_text = response.text.strip()
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
            response_text = response_text.strip()
            
            job_data = json.loads(response_text)
            
            # Validate required fields and provide meaningful defaults
            if not job_data.get("title") or job_data.get("title") == "Not specified":
                job_data["title"] = "Position Analysis"
            if not job_data.get("description"):
                raise Exception("Could not extract meaningful job description from the provided text")
            
            return JobDescription(
                title=job_data.get("title", "Position Analysis"),
                company=job_data.get("company", "Not specified"),
                description=job_data.get("description", ""),
                required_skills=job_data.get("required_skills", []) + job_data.get("technical_requirements", []),
                preferred_skills=job_data.get("preferred_skills", []) + job_data.get("soft_skills", []),
                experience_level=job_data.get("experience_level", "Not specified"),
                education_requirements=job_data.get("education_requirements", []),
                location=job_data.get("location", "Not specified")
            )
            
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing Gemini response: {str(e)}")
            logger.error(f"Raw response: {response.text[:500]}...")
            raise Exception("Failed to parse job description. Please provide a more detailed and structured job description.")
        except Exception as e:
            logger.error(f"Error parsing job description: {str(e)}")
            raise Exception(f"Failed to analyze job description: {str(e)}")

    async def extract_job_description_from_url(self, job_url: str) -> JobDescription:
        """Extract job description from URL using web scraping and Gemini analysis"""
        try:
            # Scrape the job description page
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            
            response = requests.get(job_url, headers=headers, timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Remove script and style elements
            for script in soup(["script", "style"]):
                script.decompose()
            
            # Get text content
            page_text = soup.get_text()
            
            # Clean up whitespace
            lines = (line.strip() for line in page_text.splitlines())
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            page_text = ' '.join(chunk for chunk in chunks if chunk)
            
            # Limit text length to avoid token limits but increase to capture more details
            page_text = page_text[:12000]
            
            # Use Gemini to extract structured job description with enhanced prompting
            prompt = f"""
            You are an expert HR analyst. Extract comprehensive job description information from the following webpage content and return it in JSON format.
            
            CRITICAL: Be thorough and extract ALL relevant details including technical requirements, soft skills, experience requirements, and qualifications.
            
            Required JSON structure:
            {{
                "title": "Exact job title from posting",
                "company": "Company name",
                "description": "Complete job description including responsibilities, duties, and role overview",
                "required_skills": ["skill1", "skill2", "skill3", ...],
                "preferred_skills": ["preferred_skill1", "preferred_skill2", ...],
                "experience_level": "Entry/Junior/Mid/Senior/Lead/Principal",
                "education_requirements": ["Bachelor's degree", "Master's preferred", "relevant certifications", ...],
                "location": "Job location (remote, hybrid, or specific city)",
                "employment_type": "Full-time/Part-time/Contract/Freelance",
                "salary_range": "Salary information if available",
                "industry": "Industry sector",
                "key_responsibilities": ["responsibility1", "responsibility2", ...],
                "technical_requirements": ["technical_req1", "technical_req2", ...],
                "soft_skills": ["communication", "teamwork", "leadership", ...]
            }}
            
            EXTRACTION GUIDELINES:
            1. Extract ALL technical skills, frameworks, programming languages, tools mentioned
            2. Identify both required (must-have) and preferred (nice-to-have) skills
            3. Capture the complete role description and responsibilities
            4. Note experience level requirements (years of experience, seniority level)
            5. Include educational requirements and certifications
            6. Extract soft skills and behavioral requirements
            7. If information is missing, use empty strings or empty arrays - DO NOT make assumptions
            
            Webpage content:
            {page_text}
            """
            
            response = self.model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    temperature=0.1,
                    max_output_tokens=3000,
                ),
                safety_settings=self.safety_settings
            )
            
            # Parse JSON response with better error handling
            response_text = response.text.strip()
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
            response_text = response_text.strip()
            
            job_data = json.loads(response_text)
            
            # Validate required fields and provide meaningful defaults
            if not job_data.get("title"):
                raise Exception("Could not extract job title from the webpage")
            if not job_data.get("description"):
                raise Exception("Could not extract job description from the webpage")
            
            return JobDescription(
                title=job_data.get("title", ""),
                company=job_data.get("company", ""),
                description=job_data.get("description", ""),
                required_skills=job_data.get("required_skills", []) + job_data.get("technical_requirements", []),
                preferred_skills=job_data.get("preferred_skills", []) + job_data.get("soft_skills", []),
                experience_level=job_data.get("experience_level", ""),
                education_requirements=job_data.get("education_requirements", []),
                location=job_data.get("location", "")
            )
            
        except requests.RequestException as e:
            logger.error(f"Error fetching job URL: {str(e)}")
            raise Exception(f"Failed to fetch job description from URL: {str(e)}. Please check if the URL is accessible.")
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing Gemini response: {str(e)}")
            logger.error(f"Raw response: {response.text[:500]}...")
            raise Exception("Failed to parse job description from webpage. The webpage might not contain a standard job posting.")
        except Exception as e:
            logger.error(f"Error extracting job description: {str(e)}")
            raise Exception(f"Failed to extract job description: {str(e)}")

    async def parse_resume_with_urls(self, resume_text: str) -> Dict[str, Any]:
        """Parse resume and extract both structured data and social media URLs"""
        try:
            prompt = f"""
            Analyze the following resume text and extract information in JSON format:
            
            Required JSON structure:
            {{
                "personal_info": {{
                    "name": "Full name",
                    "email": "email address",
                    "phone": "phone number",
                    "location": "location/address"
                }},
                "social_urls": {{
                    "linkedin_url": "LinkedIn profile URL if found",
                    "github_url": "GitHub profile URL if found",
                    "portfolio_url": "Portfolio/website URL if found",
                    "other_urls": ["other professional URLs"]
                }},
                "professional_summary": "Brief professional summary",
                "skills": ["skill1", "skill2", "skill3", ...],
                "experience": [
                    {{
                        "title": "Job title",
                        "company": "Company name",
                        "duration": "Time period",
                        "description": "Job description"
                    }}
                ],
                "education": [
                    {{
                        "degree": "Degree name",
                        "institution": "School/University",
                        "year": "Graduation year",
                        "gpa": "GPA if mentioned"
                    }}
                ],
                "certifications": ["cert1", "cert2", ...],
                "projects": [
                    {{
                        "name": "Project name",
                        "description": "Project description",
                        "technologies": ["tech1", "tech2", ...]
                    }}
                ],
                "languages": ["language1", "language2", ...]
            }}
            
            Resume text:
            {resume_text}
            
            Extract all available information. For social URLs, look for:
            - LinkedIn: linkedin.com/in/...
            - GitHub: github.com/...
            - Portfolio: personal websites, portfolio sites
            - Any other professional URLs
            
            If information is not found, use empty strings or empty arrays.
            """
            
            response = self.model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    temperature=0.1,
                    max_output_tokens=3000,
                ),
                safety_settings=self.safety_settings
            )
            
            logger.info(f"Gemini response received, length: {len(response.text)} chars")
            logger.debug(f"Gemini response preview: {response.text[:200]}...")
            
            # Parse JSON response
            response_text = response.text.strip()
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
            response_text = response_text.strip()
            
            parsed_data = json.loads(response_text)
            
            # Convert to ResumeData format
            resume_data = ResumeData(
                name=parsed_data.get("personal_info", {}).get("name", ""),
                email=parsed_data.get("personal_info", {}).get("email", ""),
                phone=parsed_data.get("personal_info", {}).get("phone", ""),
                location=parsed_data.get("personal_info", {}).get("location", ""),
                summary=parsed_data.get("professional_summary", ""),
                skills=parsed_data.get("skills", []),
                experience=parsed_data.get("experience", []),
                education=parsed_data.get("education", []),
                certifications=parsed_data.get("certifications", []),
                projects=parsed_data.get("projects", []),
                languages=parsed_data.get("languages", [])
            )
            
            return {
                "resume_data": resume_data,
                "social_urls": parsed_data.get("social_urls", {})
            }
            
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing Gemini response as JSON: {str(e)}")
            logger.error(f"Gemini response text: {response.text[:500]}...")
            raise Exception(f"Failed to parse resume data - Invalid JSON response: {str(e)}")
        except Exception as e:
            logger.error(f"Error parsing resume: {str(e)}")
            if hasattr(e, 'message'):
                logger.error(f"Detailed error: {e.message}")
            raise Exception(f"Failed to parse resume: {str(e)}")

    async def comprehensive_candidate_analysis(
        self, 
        resume_data: ResumeData, 
        job_description: JobDescription,
        profile_enrichment: Optional[ProfileEnrichment] = None
    ) -> Dict[str, Any]:
        """Perform comprehensive candidate analysis using Gemini - FOCUSED ON JOB DESCRIPTION MATCHING"""
        try:
            # Convert Pydantic models to dicts for JSON serialization
            experience_dicts = [exp.dict() for exp in resume_data.experience]
            education_dicts = [edu.dict() for edu in resume_data.education]
            project_dicts = [proj.dict() for proj in resume_data.projects]
            
            prompt = f"""
            You are an expert HR analyst and recruiter. Perform a comprehensive analysis of this candidate SPECIFICALLY for the given job position.
            
            **CRITICAL INSTRUCTION: ALL analysis, scoring, strengths, weaknesses, and recommendations MUST be in direct reference to the specific job requirements listed below. Do not provide generic feedback.**
            
            ===== JOB DESCRIPTION (REFERENCE FOR ALL ANALYSIS) =====
            Position: {job_description.title} at {job_description.company}
            
            Job Description:
            {job_description.description}
            
            REQUIRED SKILLS: {', '.join(job_description.required_skills)}
            PREFERRED SKILLS: {', '.join(job_description.preferred_skills)}
            EXPERIENCE LEVEL: {job_description.experience_level}
            EDUCATION REQUIREMENTS: {', '.join(job_description.education_requirements)}
            LOCATION: {job_description.location}
            
            ===== CANDIDATE RESUME =====
            Name: {resume_data.name}
            Email: {resume_data.email}
            Professional Summary: {resume_data.summary}
            
            Skills: {', '.join(resume_data.skills)}
            
            Work Experience:
            {json.dumps(experience_dicts, indent=2)}
            
            Education:
            {json.dumps(education_dicts, indent=2)}
            
            Projects:
            {json.dumps(project_dicts, indent=2)}
            
            Certifications: {', '.join(resume_data.certifications)}
            
            ===== ANALYSIS REQUIREMENTS =====
            Analyze this candidate EXCLUSIVELY for the "{job_description.title}" position. Every comment, score, and recommendation must be job-specific.
            
            Return analysis in this EXACT JSON format:
            {{
                "overall_score": 75.5,
                "score_breakdown": {{
                    "required_skills_match": 80.0,
                    "experience_relevance": 75.0,
                    "education_fit": 85.0,
                    "job_specific_alignment": 70.0
                }},
                "skills_analysis": {{
                    "matching_required_skills": ["skill1", "skill2"],
                    "missing_required_skills": ["missing_skill1", "missing_skill2"],
                    "matching_preferred_skills": ["pref_skill1"],
                    "missing_preferred_skills": ["missing_pref1", "missing_pref2"]
                }},
                "strengths_for_this_role": [
                    "Strong experience in [specific technology] which is critical for this {job_description.title} role",
                    "Previous work at [company] demonstrates exact skills needed for {job_description.company}",
                    "Education in [field] aligns perfectly with job requirements"
                ],
                "weaknesses_for_this_role": [
                    "Limited experience with [specific tool] mentioned in job requirements",
                    "No demonstrated experience in [specific area] required for this position"
                ],
                "experience_match_analysis": {{
                    "relevant_experience_years": "X years relevant to this role",
                    "matching_responsibilities": ["responsibility1", "responsibility2"],
                    "experience_level_fit": "Under-qualified/Qualified/Over-qualified for {job_description.experience_level} level",
                    "industry_relevance": "Analysis of industry experience match"
                }},
                "education_analysis": {{
                    "meets_requirements": true/false,
                    "relevant_degrees": ["degree that matches job requirements"],
                    "additional_certifications_needed": ["cert1", "cert2"]
                }},
                "hiring_recommendation": {{
                    "decision": "STRONG HIRE/HIRE/CONSIDER/REJECT",
                    "confidence_level": "High/Medium/Low",
                    "reasoning": "Specific reasoning based on job requirements match"
                }},
                "interview_focus_areas": [
                    "Ask about experience with [specific technology from job requirements]",
                    "Probe deeper into [specific project] to assess [job-relevant skill]",
                    "Verify hands-on experience with [critical job requirement]"
                ],
                "red_flags_for_this_role": [
                    "Lacks critical requirement: [specific requirement]",
                    "Experience gap in [specific area needed for role]"
                ],
                "onboarding_recommendations": [
                    "Provide training in [missing skill] before role start",
                    "Pair with senior [role type] for mentoring in [specific area]"
                ],
                "salary_fit_assessment": "Analysis of candidate level vs role requirements",
                "detailed_job_fit_analysis": "Comprehensive 2-3 paragraph analysis explaining specifically how this candidate fits (or doesn't fit) the {job_description.title} role at {job_description.company}. Reference specific job requirements, candidate experience, and provide actionable hiring recommendation."
            }}
            
            SCORING GUIDELINES (TOTAL 100 POINTS):
            - Required Skills Match (0-30): How many required skills does candidate have vs needs
            - Experience Relevance (0-30): How relevant is their experience to THIS specific role
            - Education Fit (0-20): Does education meet job requirements
            - Job-Specific Alignment (0-20): Overall fit for this exact position
            
            CRITICAL REQUIREMENTS:
            1. ALL feedback must reference the specific job requirements
            2. Compare candidate's experience directly to job responsibilities
            3. Identify specific skills gaps based on job requirements
            4. Provide job-specific interview questions
            5. Give actionable hiring recommendation for THIS role
            6. Do not provide generic HR feedback - everything must be job-specific
            """
            
            response = self.model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    temperature=0.2,
                    max_output_tokens=5000,
                ),
                safety_settings=self.safety_settings
            )
            
            logger.info(f"Analysis response received, length: {len(response.text)} chars")
            logger.debug(f"Analysis response preview: {response.text[:200]}...")
            
            # Parse JSON response with better error handling
            response_text = response.text.strip()
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
            response_text = response_text.strip()
            
            analysis = json.loads(response_text)
            
            # Validate that we got a proper job-focused analysis
            if not analysis.get("skills_analysis") or not analysis.get("detailed_job_fit_analysis"):
                raise Exception("Failed to generate comprehensive job-specific analysis")
            
            return analysis
            
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing Gemini analysis response: {str(e)}")
            logger.error(f"Analysis response text: {response.text[:500]}...")
            raise Exception(f"Failed to parse analysis results - Invalid JSON: {str(e)}")
        except Exception as e:
            logger.error(f"Error in comprehensive analysis: {str(e)}")
            raise Exception(f"Analysis failed: {str(e)}")


# Global service instance
gemini_service = GeminiService() 