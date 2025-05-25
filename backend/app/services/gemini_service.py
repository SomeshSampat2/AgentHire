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
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is required")
        
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel('gemini-2.0-flash')
        
        # Safety settings
        self.safety_settings = {
            HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        }

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
            
            # Limit text length to avoid token limits
            page_text = page_text[:8000]
            
            # Use Gemini to extract structured job description
            prompt = f"""
            Extract the job description information from the following webpage content and return it in JSON format:
            
            Required JSON structure:
            {{
                "title": "Job title",
                "company": "Company name",
                "description": "Full job description",
                "required_skills": ["skill1", "skill2", ...],
                "preferred_skills": ["skill1", "skill2", ...],
                "experience_level": "Entry/Mid/Senior/Lead",
                "education_requirements": ["requirement1", "requirement2", ...],
                "location": "Job location"
            }}
            
            Webpage content:
            {page_text}
            
            Extract the most relevant job information. If some fields are not found, use empty strings or empty arrays.
            """
            
            response = self.model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    temperature=0.1,
                    max_output_tokens=2048,
                ),
                safety_settings=self.safety_settings
            )
            
            # Parse JSON response
            job_data = json.loads(response.text.strip())
            
            return JobDescription(**job_data)
            
        except requests.RequestException as e:
            logger.error(f"Error fetching job URL: {str(e)}")
            raise Exception(f"Failed to fetch job description from URL: {str(e)}")
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing Gemini response: {str(e)}")
            raise Exception("Failed to parse job description from webpage")
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
        """Perform comprehensive candidate analysis using Gemini"""
        try:
            # Convert Pydantic models to dicts for JSON serialization
            experience_dicts = [exp.dict() for exp in resume_data.experience]
            education_dicts = [edu.dict() for edu in resume_data.education]
            project_dicts = [proj.dict() for proj in resume_data.projects]
            
            prompt = f"""
            Perform a comprehensive analysis of this candidate for the given job position.
            
            CANDIDATE RESUME:
            Name: {resume_data.name}
            Email: {resume_data.email}
            Summary: {resume_data.summary}
            Skills: {', '.join(resume_data.skills)}
            Experience: {json.dumps(experience_dicts, indent=2)}
            Education: {json.dumps(education_dicts, indent=2)}
            Projects: {json.dumps(project_dicts, indent=2)}
            Certifications: {', '.join(resume_data.certifications)}
            
            JOB DESCRIPTION:
            Title: {job_description.title}
            Company: {job_description.company}
            Description: {job_description.description}
            Required Skills: {', '.join(job_description.required_skills)}
            Preferred Skills: {', '.join(job_description.preferred_skills)}
            Experience Level: {job_description.experience_level}
            Education Requirements: {', '.join(job_description.education_requirements)}
            
            Provide analysis in the following JSON format:
            {{
                "overall_score": 75.5,
                "score_breakdown": {{
                    "resume_match": 75.0,
                    "skills_alignment": 80.0,
                    "experience_match": 85.0,
                    "education_fit": 90.0
                }},
                "strengths": [
                    "Strong technical skills in required technologies",
                    "Relevant industry experience",
                    "Excellent educational background"
                ],
                "weaknesses": [
                    "Limited experience with specific framework X",
                    "No mention of cloud platform Y"
                ],
                "missing_skills": [
                    "Docker containerization",
                    "AWS cloud services",
                    "GraphQL"
                ],
                "hr_recommendations": [
                    "Strong candidate - recommend proceeding to interview stage",
                    "Focus interview questions on cloud platform experience",
                    "Verify hands-on experience with React/Next.js during technical assessment",
                    "Consider for mid-level position based on experience"
                ],
                "red_flags": [
                    "Employment gap from 2022-2023 needs explanation"
                ],
                "fit_assessment": "EXCELLENT/GOOD/FAIR/POOR",
                "detailed_analysis": "Comprehensive paragraph explaining the overall assessment and hiring recommendation...",
                "suggested_interview_questions": [
                    "Can you explain your experience with microservices architecture?",
                    "How do you approach testing in React applications?",
                    "Walk me through your most challenging project and how you solved it"
                ]
            }}
            
            Scoring Guidelines (TOTAL MUST BE OUT OF 100):
            - Resume Match: 0-25 points (how well resume matches job requirements)
            - Skills Alignment: 0-25 points (overlap between candidate and required skills)  
            - Experience Match: 0-25 points (relevance and level of experience)
            - Education Fit: 0-25 points (educational background alignment)
            
            Overall Score = Sum of all four categories (maximum 100 points)
            
            Be thorough and specific in your analysis.
            """
            
            response = self.model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    temperature=0.2,
                    max_output_tokens=4000,
                ),
                safety_settings=self.safety_settings
            )
            
            logger.info(f"Analysis response received, length: {len(response.text)} chars")
            logger.debug(f"Analysis response preview: {response.text[:200]}...")
            
            # Parse JSON response
            response_text = response.text.strip()
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
            response_text = response_text.strip()
            
            analysis = json.loads(response_text)
            
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