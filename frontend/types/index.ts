import { ReactNode } from 'react';

// Core Types
export interface ResumeData {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  education: Array<{
    degree: string;
    institution: string;
    year: string;
    gpa?: string;
  }>;
  skills: string[];
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
  }>;
  certifications: string[];
  languages: string[];
  summary?: string;
  projects?: Array<{
    name: string;
    description: string;
    technologies: string[];
  }>;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
}

export interface JobDescription {
  title: string;
  company: string;
  description: string;
  required_skills: string[];
  preferred_skills: string[];
  experience_level?: string;
  education_requirements: string[];
  location?: string;
}

export interface LinkedInProfile {
  headline?: string;
  summary?: string;
  experience: Array<{ [key: string]: string }>;
  education: Array<{ [key: string]: string }>;
  skills: string[];
  endorsements: { [key: string]: number };
  connections?: number;
  certifications: string[];
}

export interface GitHubProfile {
  username: string;
  name?: string;
  bio?: string;
  public_repos: number;
  followers: number;
  following: number;
  repositories: Array<{
    name: string;
    description?: string;
    language?: string;
    stars: number;
    forks: number;
    updated_at: string;
    url: string;
  }>;
  languages: { [key: string]: number };
  contribution_stats: { [key: string]: any };
  top_repositories: Array<{
    name: string;
    description?: string;
    language?: string;
    stars: number;
    forks: number;
    updated_at: string;
    url: string;
  }>;
}

export interface ProfileEnrichment {
  linkedin?: LinkedInProfile;
  github?: GitHubProfile;
  portfolio?: { [key: string]: any };
}

export interface ScoreBreakdown {
  resume_match: number;
  linkedin_score: number;
  github_score: number;
  portfolio_score: number;
  total_score: number;
  explanation: string;
}

export interface CandidateAnalysis {
  candidate_name?: string;
  resume_data: ResumeData;
  job_description: JobDescription;
  profile_enrichment?: ProfileEnrichment;
  score_breakdown: ScoreBreakdown;
  recommendations: string[];
  red_flags: string[];
  analysis_timestamp: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface UploadResumeResponse {
  success: boolean;
  message: string;
  file_id: string;
  resume_data?: ResumeData;
}

export interface AnalyzeCandidateResponse {
  success: boolean;
  message: string;
  analysis?: CandidateAnalysis;
}

export interface EnrichProfileResponse {
  success: boolean;
  message: string;
  enrichment?: ProfileEnrichment;
}

// Form Types
export interface JobDescriptionForm {
  title: string;
  company: string;
  description: string;
  required_skills: string;
  preferred_skills: string;
  experience_level: string;
  education_requirements: string;
  location: string;
}

export interface ProfileUrlsForm {
  linkedin_url: string;
  github_url: string;
  portfolio_url: string;
}

// UI State Types
export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface ErrorState {
  hasError: boolean;
  message?: string;
  code?: string;
}

// Analysis Step Types
export type AnalysisStep = 
  | 'upload'
  | 'job-description'
  | 'profile-urls'
  | 'analyzing'
  | 'results';

export interface AnalysisProgress {
  currentStep: AnalysisStep;
  completedSteps: AnalysisStep[];
  totalSteps: number;
}

// Chart Data Types
export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string[];
    borderWidth?: number;
  }>;
}

export interface ScoreChartData {
  resume: number;
  linkedin: number;
  github: number;
  portfolio: number;
  total: number;
}

// Component Props Types
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

export interface InputProps {
  label?: string;
  error?: string;
  helpText?: string;
  required?: boolean;
  className?: string;
}

export interface CardProps {
  title?: string;
  subtitle?: string;
  className?: string;
  children: ReactNode;
} 