import { useState } from 'react'
import Head from 'next/head'
import { Zap } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import ResumeUpload from '../components/ResumeUpload'
import CandidateRanking from '../components/CandidateRanking'
import AnalysisResults from '../components/AnalysisResults'
import { CandidateAnalysis, MultiCandidateResponse } from '../types'

interface AnalysisState {
  analyzing: boolean
  results: MultiCandidateResponse | null
  selectedCandidateId: string | null
}

export default function Home() {
  const [files, setFiles] = useState<File[]>([])
  const [jobDescription, setJobDescription] = useState('')
  const [analysis, setAnalysis] = useState<AnalysisState>({ 
    analyzing: false, 
    results: null, 
    selectedCandidateId: null 
  })
  const [currentView, setCurrentView] = useState<'upload' | 'results' | 'candidate-detail'>('upload')

  const handleMultiFilesChange = (newFiles: File[]) => {
    setFiles(newFiles)
  }

  const handleAnalyze = async () => {
    if (files.length === 0) {
      toast.error('Please upload at least one resume')
      return
    }

    if (!jobDescription.trim()) {
      toast.error('Job description is required')
      return
    }

    if (jobDescription.trim().length < 50) {
      toast.error('Please provide a more detailed job description (minimum 50 characters)')
      return
    }

    setAnalysis({ analyzing: true, results: null, selectedCandidateId: null })

    try {
      const formData = new FormData()
      files.forEach((file) => {
        formData.append('files', file)
      })
      formData.append('job_description', jobDescription.trim())

      const response = await fetch('http://localhost:8000/api/multi-candidate-analysis', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.detail || 'Analysis failed')
      }

      if (result.success) {
        setAnalysis({
          analyzing: false,
          results: result,
          selectedCandidateId: null
        })
        setCurrentView('results')
        const candidateText = files.length === 1 ? 'candidate' : `${files.length} candidates`
        toast.success(`Analysis completed for ${candidateText}!`)
      } else {
        throw new Error(result.message || 'Analysis failed')
      }
    } catch (error) {
      console.error('Analysis error:', error)
      toast.error(error instanceof Error ? error.message : 'Analysis failed')
      setAnalysis({ analyzing: false, results: null, selectedCandidateId: null })
    }
  }

  const handleCandidateSelect = (candidateId: string) => {
    setAnalysis(prev => ({ ...prev, selectedCandidateId: candidateId }))
    setCurrentView('candidate-detail')
  }

  const handleBackToRankings = () => {
    setAnalysis(prev => ({ ...prev, selectedCandidateId: null }))
    setCurrentView('results')
  }

  const handleNewAnalysis = () => {
    setFiles([])
    setJobDescription('')
    setAnalysis({ analyzing: false, results: null, selectedCandidateId: null })
    setCurrentView('upload')
  }

  // Show candidate rankings/results
  if (currentView === 'results' && analysis.results?.multi_analysis) {
    const isMultipleCandidates = analysis.results.multi_analysis.total_candidates > 1
    
    return (
      <>
        <Head>
          <title>Analysis Results - HireAgent</title>
          <meta name="description" content="AI-powered candidate analysis results" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <h1 className="text-2xl font-bold text-gray-900">HireAgent</h1>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">AI-Powered Hiring Assistant</p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <CandidateRanking
              multiAnalysis={analysis.results.multi_analysis}
              onCandidateSelect={handleCandidateSelect}
              onNewAnalysis={handleNewAnalysis}
            />
          </main>
        </div>

        <Toaster position="top-right" />
      </>
    )
  }

  // Show individual candidate detail
  if (currentView === 'candidate-detail' && analysis.results && analysis.selectedCandidateId) {
    const candidateDetails = analysis.results.candidate_details[analysis.selectedCandidateId]
    const selectedRanking = analysis.results.multi_analysis?.candidate_rankings.find(
      c => c.candidate_id === analysis.selectedCandidateId
    )

    if (candidateDetails && selectedRanking) {
      // Use the real CandidateAnalysis object from the backend
      const candidateAnalysis = candidateDetails.candidate_analysis || {
        candidate_name: selectedRanking.candidate_name,
        resume_data: {} as any,
        job_description: analysis.results.multi_analysis!.job_description,
        score_breakdown: {
          resume_match: candidateDetails.analysis_details?.job_specific_scoring?.required_skills_match || 0,
          linkedin_score: 0,
          github_score: 0,
          portfolio_score: 0,
          total_score: selectedRanking.total_score,
          explanation: candidateDetails.analysis_details?.hiring_recommendation?.reasoning || ''
        },
        recommendations: candidateDetails.analysis_details?.interview_focus_areas || [],
        red_flags: candidateDetails.analysis_details?.weaknesses_for_role || [],
        analysis_timestamp: analysis.results.multi_analysis!.analysis_timestamp
      }
      
      // Use the structured analysis details
      const analysisDetails = candidateDetails.analysis_details || candidateDetails

      return (
        <>
          <Head>
            <title>{selectedRanking.candidate_name} - Analysis Details</title>
            <meta name="description" content={`Detailed analysis for ${selectedRanking.candidate_name}`} />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <link rel="icon" href="/favicon.ico" />
          </Head>

          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <header className="bg-white shadow-sm border-b">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <h1 className="text-2xl font-bold text-gray-900">HireAgent</h1>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600">AI-Powered Hiring Assistant</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button 
                      onClick={handleBackToRankings}
                      className="btn-secondary"
                    >
                      ← Back to {analysis.results?.multi_analysis?.total_candidates === 1 ? 'Results' : 'Rankings'}
                    </button>
                  </div>
                </div>
              </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {/* Candidate Header */}
              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedRanking.candidate_name}</h2>
                    <p className="text-gray-600">Rank #{selectedRanking.rank} • {selectedRanking.filename}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-indigo-600">
                      {selectedRanking.total_score.toFixed(1)}/100
                    </div>
                    <p className="text-sm text-gray-600">Overall Score</p>
                  </div>
                </div>
              </div>

              <AnalysisResults 
                results={candidateAnalysis} 
                onNewAnalysis={handleNewAnalysis}
                analysisDetails={analysisDetails}
              />
            </main>
          </div>

          <Toaster position="top-right" />
        </>
      )
    }
  }

  // Main upload interface
  return (
    <>
      <Head>
        <title>HireAgent - AI-Powered Hiring Assistant</title>
        <meta name="description" content="Analyze candidates with AI-powered resume matching and profile enrichment" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <h1 className="text-2xl font-bold text-gray-900">HireAgent</h1>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">AI-Powered Hiring Assistant</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <Zap className="h-16 w-16 text-indigo-600 mx-auto mb-6" />
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              AI-Powered Candidate Analysis
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Upload one or multiple resumes for comprehensive AI analysis with automatic profile enrichment and intelligent ranking
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-8">
              {/* Resume Upload Section */}
              <div className="mb-8">
                <label className="block text-lg font-semibold text-gray-900 mb-4">
                  1. Upload Resume{files.length !== 1 ? 's' : ''}
                </label>
                
                <ResumeUpload
                  onMultiUploadSuccess={handleMultiFilesChange}
                />
              </div>

              {/* Job Description Section */}
              <div className="mb-8">
                <label htmlFor="job-description" className="block text-lg font-semibold text-gray-900 mb-4">
                  2. Job Description (Required) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <textarea
                    id="job-description"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the complete job description here including role responsibilities, required skills, qualifications, etc..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm min-h-[200px] resize-y"
                    required
                    rows={8}
                  />
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  <span className="text-red-600 font-medium">Required:</span> Paste the complete job description to provide accurate matching and scoring. Include role details, requirements, and qualifications.
                </p>
                <div className="mt-2 text-xs text-gray-500">
                  Characters: {jobDescription.length} / 50 minimum
                </div>
              </div>

              {/* AI Features Info */}
              <div className="mb-8 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                <h3 className="text-lg font-semibold text-indigo-900 mb-3">
                  🤖 AI-Powered Features
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-indigo-700">
                  <div className="flex items-start">
                    <span className="inline-block w-2 h-2 bg-indigo-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span>Automatic extraction of LinkedIn, GitHub, and portfolio URLs from resume</span>
                  </div>
                  <div className="flex items-start">
                    <span className="inline-block w-2 h-2 bg-indigo-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span>Intelligent parsing and analysis of job description requirements</span>
                  </div>
                  <div className="flex items-start">
                    <span className="inline-block w-2 h-2 bg-indigo-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span>Comprehensive skills matching and gap analysis</span>
                  </div>
                  <div className="flex items-start">
                    <span className="inline-block w-2 h-2 bg-indigo-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span>{files.length > 1 ? 'Multi-candidate ranking and comparison' : 'Job-specific scoring with hiring recommendations'}</span>
                  </div>
                </div>
              </div>

              {/* Analyze Button */}
              <button
                onClick={handleAnalyze}
                disabled={
                  files.length === 0 || 
                  !jobDescription.trim() || 
                  jobDescription.trim().length < 50 || 
                  analysis.analyzing
                }
                className={`
                  w-full py-4 px-6 rounded-lg text-lg font-semibold transition-all
                  ${files.length === 0 || 
                    !jobDescription.trim() || 
                    jobDescription.trim().length < 50 || 
                    analysis.analyzing
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 transform hover:scale-105'
                  }
                `}
              >
                {analysis.analyzing ? (
                  <div className="flex items-center justify-center">
                    <div className="loading-spinner mr-3"></div>
                    Analyzing {files.length} {files.length === 1 ? 'candidate' : 'candidates'}...
                  </div>
                ) : (
                  `🚀 Analyze ${files.length} ${files.length === 1 ? 'Candidate' : 'Candidates'}`
                )}
              </button>

              {(files.length === 0 || !jobDescription.trim() || jobDescription.trim().length < 50) && (
                <p className="text-center text-sm text-gray-500 mt-4">
                  {files.length === 0 && 'Please upload at least one resume'}
                  {files.length > 0 && !jobDescription.trim() && 'Please enter a job description'}
                  {files.length > 0 && jobDescription.trim() && jobDescription.trim().length < 50 && 'Job description must be at least 50 characters'}
                </p>
              )}
            </div>
          </div>
        </main>
      </div>

      <Toaster position="top-right" />
    </>
  )
} 