import { useState } from 'react'
import { CheckCircle, AlertTriangle, User, Briefcase, Star, Download, Zap } from 'lucide-react'
import { CandidateAnalysis } from '@/types'

interface AnalysisResultsProps {
  results: CandidateAnalysis
  onNewAnalysis: () => void
  analysisDetails?: {
    strengths: string[]
    weaknesses: string[]
    missing_skills: string[]
    fit_assessment: string
    interview_questions: string[]
  }
}

export default function AnalysisResults({ results, onNewAnalysis, analysisDetails }: AnalysisResultsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'enrichment' | 'interview'>('overview')

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

  const getFitAssessmentColor = (assessment: string) => {
    switch (assessment?.toUpperCase()) {
      case 'EXCELLENT': return 'text-green-600 bg-green-100'
      case 'GOOD': return 'text-blue-600 bg-blue-100'
      case 'FAIR': return 'text-yellow-600 bg-yellow-100'
      case 'POOR': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const formatScore = (score: number) => Math.round(score * 10) / 10

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Analysis Complete
        </h2>
        <p className="text-gray-600">
          Comprehensive AI-powered candidate evaluation with profile enrichment
        </p>
      </div>

      {/* Score Overview Card */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Overall Assessment</h3>
          {analysisDetails?.fit_assessment && (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getFitAssessmentColor(analysisDetails.fit_assessment)}`}>
              {analysisDetails.fit_assessment} FIT
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${getScoreBgColor(results.score_breakdown.total_score)} mb-3`}>
              <span className={`text-2xl font-bold ${getScoreColor(results.score_breakdown.total_score)}`}>
                {formatScore(results.score_breakdown.total_score)}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-900">Total Score</p>
            <p className="text-xs text-gray-500">Out of 145</p>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-3">
              <span className="text-xl font-bold text-blue-600">
                {formatScore(results.score_breakdown.resume_match)}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-900">Resume Match</p>
            <p className="text-xs text-gray-500">Out of 100</p>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-3">
              <span className="text-lg font-bold text-blue-600">
                {formatScore(results.score_breakdown.linkedin_score)}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-900">LinkedIn</p>
            <p className="text-xs text-gray-500">Out of 20</p>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-3">
              <span className="text-lg font-bold text-gray-600">
                {formatScore(results.score_breakdown.github_score)}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-900">GitHub</p>
            <p className="text-xs text-gray-500">Out of 15</p>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-3">
              <span className="text-lg font-bold text-green-600">
                {formatScore(results.score_breakdown.portfolio_score)}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-900">Portfolio</p>
            <p className="text-xs text-gray-500">Out of 10</p>
          </div>
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
              onClick={() => setActiveTab('details')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'details'
                  ? 'border-b-2 border-indigo-500 text-indigo-600 bg-indigo-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Candidate Details
            </button>
            <button
              onClick={() => setActiveTab('enrichment')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'enrichment'
                  ? 'border-b-2 border-indigo-500 text-indigo-600 bg-indigo-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Profile Enrichment
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
                {analysisDetails?.strengths && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Star className="h-5 w-5 text-green-500 mr-2" />
                      Key Strengths
                    </h3>
                    <ul className="space-y-2">
                      {analysisDetails.strengths.map((strength, index) => (
                        <li key={index} className="flex items-start">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                          <span className="text-gray-700">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysisDetails?.weaknesses && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
                      Areas for Improvement
                    </h3>
                    <ul className="space-y-2">
                      {analysisDetails.weaknesses.map((weakness, index) => (
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
              {analysisDetails?.missing_skills && analysisDetails.missing_skills.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Missing Skills & Requirements</h3>
                  <div className="flex flex-wrap gap-2">
                    {analysisDetails.missing_skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 text-red-800"
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

          {activeTab === 'details' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <User className="h-5 w-5 text-indigo-600 mr-2" />
                    Candidate Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Name:</span>
                      <p className="text-gray-900">{results.candidate_name || 'Not specified'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Email:</span>
                      <p className="text-gray-900">{results.resume_data.email || 'Not specified'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Phone:</span>
                      <p className="text-gray-900">{results.resume_data.phone || 'Not specified'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Location:</span>
                      <p className="text-gray-900">{results.resume_data.location || 'Not specified'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Briefcase className="h-5 w-5 text-indigo-600 mr-2" />
                    Position Details
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Role:</span>
                      <p className="text-gray-900">{results.job_description.title}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Company:</span>
                      <p className="text-gray-900">{results.job_description.company}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Location:</span>
                      <p className="text-gray-900">{results.job_description.location || 'Not specified'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Experience Level:</span>
                      <p className="text-gray-900">{results.job_description.experience_level || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {results.resume_data.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {results.resume_data.summary && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Summary</h3>
                  <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">{results.resume_data.summary}</p>
                </div>
              )}

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
            </div>
          )}

          {activeTab === 'enrichment' && (
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

          {activeTab === 'interview' && (
            <div className="space-y-6">
              {analysisDetails?.interview_questions && analysisDetails.interview_questions.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Suggested Interview Questions</h3>
                  <div className="space-y-4">
                    {analysisDetails.interview_questions.map((question, index) => (
                      <div key={index} className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                        <p className="text-indigo-900 font-medium">Q{index + 1}: {question}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Assessment Summary</h3>
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <span className="text-sm font-medium text-gray-600 mr-2">Overall Fit:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getFitAssessmentColor(analysisDetails?.fit_assessment || 'Unknown')}`}>
                      {analysisDetails?.fit_assessment || 'Unknown'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700">
                    <p><strong>Total Score:</strong> {formatScore(results.score_breakdown.total_score)} / 145</p>
                    <p><strong>Resume Match:</strong> {formatScore(results.score_breakdown.resume_match)}%</p>
                  </div>
                </div>
              </div>

              {!analysisDetails?.interview_questions?.length && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No interview questions generated</p>
                  <p className="text-sm text-gray-400 mt-2">Try providing a job description URL for better interview questions</p>
                </div>
              )}
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