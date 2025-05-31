import { useState } from 'react'
import { CheckCircle, AlertTriangle, User, Briefcase, Star, Download, Zap, Target, TrendingUp, AlertCircle } from 'lucide-react'
import { CandidateAnalysis } from '@/types'

interface AnalysisResultsProps {
  results: CandidateAnalysis
  onNewAnalysis: () => void
  analysisDetails?: {
    job_specific_scoring: {
      required_skills_match: number
      experience_relevance: number
      education_fit: number
      job_specific_alignment: number
    }
    skills_analysis: {
      matching_required_skills: string[]
      missing_required_skills: string[]
      matching_preferred_skills: string[]
      missing_preferred_skills: string[]
    }
    strengths_for_role: string[]
    weaknesses_for_role: string[]
    experience_match: {
      relevant_experience_years: string
      matching_responsibilities: string[]
      experience_level_fit: string
      industry_relevance: string
    }
    education_analysis: {
      meets_requirements: boolean
      relevant_degrees: string[]
      additional_certifications_needed: string[]
    }
    hiring_recommendation: {
      decision: string
      confidence_level: string
      reasoning: string
    }
    interview_focus_areas: string[]
    onboarding_recommendations: string[]
    salary_fit_assessment: string
    extracted_social_urls: {
      linkedin_url?: string
      github_url?: string
      portfolio_url?: string
    }
  }
}

export default function AnalysisResults({ results, onNewAnalysis, analysisDetails }: AnalysisResultsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'experience' | 'interview' | 'recommendation'>('overview')

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100'
    if (score >= 60) return 'bg-yellow-100'
    return 'bg-red-100'
  }

  const getHiringDecisionColor = (decision: string) => {
    switch (decision?.toUpperCase()) {
      case 'STRONG HIRE': return 'text-green-700 bg-green-100 border-green-200'
      case 'HIRE': return 'text-green-600 bg-green-50 border-green-200'
      case 'CONSIDER': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'REJECT': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const formatScore = (score: number) => Math.round(score * 10) / 10

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <Target className="h-12 w-12 text-indigo-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Job-Specific Analysis Complete
        </h2>
        <p className="text-gray-600">
          AI-powered candidate evaluation for <span className="font-semibold text-indigo-600">{results.job_description.title}</span> at <span className="font-semibold">{results.job_description.company}</span>
        </p>
      </div>

      {/* Job-Specific Score Overview */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Job Match Assessment</h3>
          {analysisDetails?.hiring_recommendation?.decision && (
            <div className={`px-4 py-2 rounded-lg border text-sm font-medium ${getHiringDecisionColor(analysisDetails.hiring_recommendation.decision)}`}>
              {analysisDetails.hiring_recommendation.decision}
              <span className="ml-2 text-xs">({analysisDetails.hiring_recommendation.confidence_level} confidence)</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${getScoreBgColor(results.score_breakdown.total_score)} mb-3`}>
              <span className={`text-2xl font-bold ${getScoreColor(results.score_breakdown.total_score)}`}>
                {formatScore(results.score_breakdown.total_score)}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-900">Overall Score</p>
            <p className="text-xs text-gray-500">Out of 100</p>
          </div>

          {analysisDetails?.job_specific_scoring && (
            <>
              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${getScoreBgColor(analysisDetails.job_specific_scoring.required_skills_match)} mb-3`}>
                  <span className={`text-lg font-bold ${getScoreColor(analysisDetails.job_specific_scoring.required_skills_match)}`}>
                    {formatScore(analysisDetails.job_specific_scoring.required_skills_match)}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900">Skills Match</p>
                <p className="text-xs text-gray-500">Required skills</p>
              </div>

              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${getScoreBgColor(analysisDetails.job_specific_scoring.experience_relevance)} mb-3`}>
                  <span className={`text-lg font-bold ${getScoreColor(analysisDetails.job_specific_scoring.experience_relevance)}`}>
                    {formatScore(analysisDetails.job_specific_scoring.experience_relevance)}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900">Experience</p>
                <p className="text-xs text-gray-500">Role relevance</p>
              </div>

              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${getScoreBgColor(analysisDetails.job_specific_scoring.education_fit)} mb-3`}>
                  <span className={`text-lg font-bold ${getScoreColor(analysisDetails.job_specific_scoring.education_fit)}`}>
                    {formatScore(analysisDetails.job_specific_scoring.education_fit)}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900">Education</p>
                <p className="text-xs text-gray-500">Requirements fit</p>
              </div>

              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${getScoreBgColor(analysisDetails.job_specific_scoring.job_specific_alignment)} mb-3`}>
                  <span className={`text-lg font-bold ${getScoreColor(analysisDetails.job_specific_scoring.job_specific_alignment)}`}>
                    {formatScore(analysisDetails.job_specific_scoring.job_specific_alignment)}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900">Job Fit</p>
                <p className="text-xs text-gray-500">Overall alignment</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Enhanced Tabs */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'border-b-2 border-indigo-500 text-indigo-600 bg-indigo-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('skills')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'skills'
                  ? 'border-b-2 border-indigo-500 text-indigo-600 bg-indigo-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Skills Analysis
            </button>
            <button
              onClick={() => setActiveTab('experience')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'experience'
                  ? 'border-b-2 border-indigo-500 text-indigo-600 bg-indigo-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Experience & Education
            </button>
            <button
              onClick={() => setActiveTab('interview')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'interview'
                  ? 'border-b-2 border-indigo-500 text-indigo-600 bg-indigo-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Interview Guide
            </button>
            <button
              onClick={() => setActiveTab('recommendation')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'recommendation'
                  ? 'border-b-2 border-indigo-500 text-indigo-600 bg-indigo-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Hiring Decision
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Summary */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Analysis Summary</h3>
                <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">
                  {results.score_breakdown.explanation}
                </p>
              </div>

              {/* Strengths and Weaknesses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {analysisDetails?.strengths_for_role && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Star className="h-5 w-5 text-green-500 mr-2" />
                      Key Strengths
                    </h3>
                    <ul className="space-y-2">
                      {analysisDetails.strengths_for_role.map((strength, index) => (
                        <li key={index} className="flex items-start">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                          <span className="text-gray-700">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysisDetails?.weaknesses_for_role && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
                      Areas for Improvement
                    </h3>
                    <ul className="space-y-2">
                      {analysisDetails.weaknesses_for_role.map((weakness, index) => (
                        <li key={index} className="flex items-start">
                          <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                          <span className="text-gray-700">{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Missing Skills */}
              {analysisDetails?.skills_analysis && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills Analysis</h3>
                  <div className="flex flex-wrap gap-2">
                    {analysisDetails.skills_analysis.matching_required_skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                      >
                        {skill}
                      </span>
                    ))}
                    {analysisDetails.skills_analysis.missing_required_skills.map((skill, index) => (
                      <span
                        key={`missing_${index}`}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 text-red-800"
                      >
                        {skill}
                      </span>
                    ))}
                    {analysisDetails.skills_analysis.matching_preferred_skills.map((skill, index) => (
                      <span
                        key={`matching_preferred_${index}`}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                      >
                        {skill}
                      </span>
                    ))}
                    {analysisDetails.skills_analysis.missing_preferred_skills.map((skill, index) => (
                      <span
                        key={`missing_preferred_${index}`}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {results.recommendations.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Zap className="h-5 w-5 text-indigo-500 mr-2" />
                    AI Recommendations
                  </h3>
                  <ul className="space-y-2">
                    {results.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-indigo-500 mt-0.5 mr-2 flex-shrink-0" />
                        <span className="text-gray-700">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Red Flags */}
              {results.red_flags.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                    Areas of Concern
                  </h3>
                  <ul className="space-y-2">
                    {results.red_flags.map((flag, index) => (
                      <li key={index} className="flex items-start">
                        <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                        <span className="text-gray-700">{flag}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'skills' && (
            <div className="space-y-6">
              {results.profile_enrichment?.github && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">GitHub Profile</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">
                          {results.profile_enrichment.github.public_repos}
                        </p>
                        <p className="text-sm text-gray-500">Repositories</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">
                          {results.profile_enrichment.github.followers}
                        </p>
                        <p className="text-sm text-gray-500">Followers</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">
                          {Object.keys(results.profile_enrichment.github.languages).length}
                        </p>
                        <p className="text-sm text-gray-500">Languages</p>
                      </div>
                    </div>
                    {results.profile_enrichment.github.bio && (
                      <p className="text-gray-700">{results.profile_enrichment.github.bio}</p>
                    )}
                  </div>
                </div>
              )}

              {results.profile_enrichment?.portfolio && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Analysis</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 mb-2">
                      <strong>Title:</strong> {results.profile_enrichment.portfolio.title || 'Not available'}
                    </p>
                    <p className="text-gray-700 mb-4">
                      <strong>Description:</strong> {results.profile_enrichment.portfolio.description || 'Not available'}
                    </p>
                    {results.profile_enrichment.portfolio.technologies && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-2">Technologies Found:</p>
                        <div className="flex flex-wrap gap-2">
                          {results.profile_enrichment.portfolio.technologies.map((tech: string, index: number) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-800"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!results.profile_enrichment && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No profile enrichment data available</p>
                  <p className="text-sm text-gray-400 mt-2">The AI couldn't find or extract social media profile URLs from the resume</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'experience' && (
            <div className="space-y-6">
              {results.resume_data.experience.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Experience</h3>
                  <div className="space-y-4">
                    {results.resume_data.experience.map((exp, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900">{exp.title}</h4>
                        <p className="text-gray-600">{exp.company} • {exp.duration}</p>
                        <p className="text-gray-700 mt-2">{exp.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {analysisDetails?.education_analysis && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Education Analysis</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Meets Requirements:</span>
                      <p className="text-gray-900">{analysisDetails.education_analysis.meets_requirements ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Relevant Degrees:</span>
                      <p className="text-gray-900">{analysisDetails.education_analysis.relevant_degrees.join(', ')}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Additional Certifications Needed:</span>
                      <p className="text-gray-900">{analysisDetails.education_analysis.additional_certifications_needed.join(', ')}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'interview' && (
            <div className="space-y-6">
              {analysisDetails?.interview_focus_areas && analysisDetails.interview_focus_areas.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Interview Focus Areas</h3>
                  <div className="space-y-4">
                    {analysisDetails.interview_focus_areas.map((area, index) => (
                      <div key={index} className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                        <p className="text-indigo-900 font-medium">Area {index + 1}: {area}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Assessment Summary</h3>
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="text-sm text-gray-700">
                    <p><strong>Total Score:</strong> {formatScore(results.score_breakdown.total_score)} / 100</p>
                    <p><strong>Resume Match:</strong> {formatScore(results.score_breakdown.resume_match)}%</p>
                  </div>
                </div>
              </div>

              {!analysisDetails?.interview_focus_areas?.length && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No interview focus areas generated</p>
                  <p className="text-sm text-gray-400 mt-2">Try providing a job description URL for better interview focus areas</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'recommendation' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Hiring Recommendation</h3>
                <div className={`px-4 py-2 rounded-lg border text-sm font-medium ${getHiringDecisionColor(analysisDetails?.hiring_recommendation.decision || 'Unknown')}`}>
                  {analysisDetails?.hiring_recommendation.decision || 'Unknown'}
                  <span className="ml-2 text-xs">({analysisDetails?.hiring_recommendation.confidence_level || 'Unknown'} confidence)</span>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Reasoning</h3>
                <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">{analysisDetails?.hiring_recommendation.reasoning || 'No reasoning provided'}</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Onboarding Recommendations</h3>
                <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">{analysisDetails?.onboarding_recommendations.join(', ') || 'No recommendations provided'}</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Salary Fit Assessment</h3>
                <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">{analysisDetails?.salary_fit_assessment || 'No salary fit assessment provided'}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-center space-x-4 mt-8">
        <button
          onClick={onNewAnalysis}
          className="btn-primary"
        >
          Analyze Another Candidate
        </button>
        <button
          onClick={() => window.print()}
          className="btn-secondary flex items-center"
        >
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </button>
      </div>
    </div>
  )
} 