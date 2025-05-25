import { useState } from 'react'
import Head from 'next/head'
import { Upload, FileText, Zap, AlertCircle, CheckCircle } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import AnalysisResults from '@/components/AnalysisResults'

interface AnalysisState {
  analyzing: boolean
  results: any
  extractedUrls: any
  analysisDetails: any
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [jobUrl, setJobUrl] = useState('')
  const [analysis, setAnalysis] = useState<AnalysisState>({
    analyzing: false,
    results: null,
    extractedUrls: null,
    analysisDetails: null
  })

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
      if (!validTypes.includes(selectedFile.type)) {
        toast.error('Please upload a PDF, DOCX, or TXT file')
        return
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB')
        return
      }
      setFile(selectedFile)
      toast.success('Resume uploaded successfully!')
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    const droppedFile = event.dataTransfer.files[0]
    if (droppedFile) {
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
      if (!validTypes.includes(droppedFile.type)) {
        toast.error('Please upload a PDF, DOCX, or TXT file')
        return
      }
      if (droppedFile.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB')
        return
      }
      setFile(droppedFile)
      toast.success('Resume uploaded successfully!')
    }
  }

  const validateJobUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleAnalyze = async () => {
    if (!file) {
      toast.error('Please upload a resume first')
      return
    }

    if (jobUrl.trim() && !validateJobUrl(jobUrl)) {
      toast.error('Please enter a valid job description URL')
      return
    }

    setAnalysis({ analyzing: true, results: null, extractedUrls: null, analysisDetails: null })

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('job_url', jobUrl.trim())

      const response = await fetch('/api/comprehensive-analysis', {
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
          results: result.analysis,
          extractedUrls: result.extracted_urls,
          analysisDetails: result.analysis_details
        })
        toast.success('Analysis completed successfully!')
      } else {
        throw new Error(result.message || 'Analysis failed')
      }
    } catch (error) {
      console.error('Analysis error:', error)
      toast.error(error instanceof Error ? error.message : 'Analysis failed')
      setAnalysis({ analyzing: false, results: null, extractedUrls: null, analysisDetails: null })
    }
  }

  const handleNewAnalysis = () => {
    setFile(null)
    setJobUrl('')
    setAnalysis({ analyzing: false, results: null, extractedUrls: null, analysisDetails: null })
  }

  // Show results if analysis is complete
  if (analysis.results) {
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
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={handleNewAnalysis}
                    className="btn-secondary"
                  >
                    New Analysis
                  </button>
                </div>
              </div>
            </div>
          </header>

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Extracted URLs Display */}
            {analysis.extractedUrls && Object.values(analysis.extractedUrls).some(url => url) && (
              <div className="mb-8 bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🔗 Extracted Profile URLs</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {analysis.extractedUrls.linkedin_url && (
                    <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                      <span className="text-blue-600 font-medium">LinkedIn:</span>
                      <a 
                        href={analysis.extractedUrls.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-blue-600 hover:underline truncate"
                      >
                        {analysis.extractedUrls.linkedin_url}
                      </a>
                    </div>
                  )}
                  {analysis.extractedUrls.github_url && (
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700 font-medium">GitHub:</span>
                      <a 
                        href={analysis.extractedUrls.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-gray-700 hover:underline truncate"
                      >
                        {analysis.extractedUrls.github_url}
                      </a>
                    </div>
                  )}
                  {analysis.extractedUrls.portfolio_url && (
                    <div className="flex items-center p-3 bg-green-50 rounded-lg">
                      <span className="text-green-600 font-medium">Portfolio:</span>
                      <a 
                        href={analysis.extractedUrls.portfolio_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-green-600 hover:underline truncate"
                      >
                        {analysis.extractedUrls.portfolio_url}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Analysis Results */}
            <AnalysisResults 
              results={analysis.results} 
              onNewAnalysis={handleNewAnalysis}
              analysisDetails={analysis.analysisDetails}
            />
          </main>
        </div>

        <Toaster position="top-right" />
      </>
    )
  }

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
              Upload a resume and job description URL for comprehensive AI analysis with automatic profile enrichment
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-8">
              {/* File Upload Section */}
              <div className="mb-8">
                <label className="block text-lg font-semibold text-gray-900 mb-4">
                  1. Upload Resume
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className={`
                    border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
                    ${file 
                      ? 'border-green-400 bg-green-50' 
                      : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
                    }
                  `}
                >
                  <input
                    type="file"
                    id="resume-upload"
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <label htmlFor="resume-upload" className="cursor-pointer">
                    {file ? (
                      <div className="flex items-center justify-center">
                        <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
                        <div>
                          <p className="text-lg font-medium text-green-700">
                            ✅ {file.name}
                          </p>
                          <p className="text-sm text-green-600">
                            Click to change file
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-lg font-medium text-gray-900 mb-2">
                          Drag & drop your resume or click to browse
                        </p>
                        <p className="text-gray-600 mb-4">
                          Supports PDF, DOCX, and TXT files up to 10MB
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Job URL Section */}
              <div className="mb-8">
                <label htmlFor="job-url" className="block text-lg font-semibold text-gray-900 mb-4">
                  2. Job Description URL (Optional)
                </label>
                <div className="relative">
                  <input
                    type="url"
                    id="job-url"
                    value={jobUrl}
                    onChange={(e) => setJobUrl(e.target.value)}
                    placeholder="https://example.com/job-posting"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <FileText className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  AI will extract job requirements from any job posting URL. Leave blank for general resume analysis.
                </p>
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
                    <span>Intelligent job requirements parsing from any job posting website</span>
                  </div>
                  <div className="flex items-start">
                    <span className="inline-block w-2 h-2 bg-indigo-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span>Comprehensive skills matching and gap analysis</span>
                  </div>
                  <div className="flex items-start">
                    <span className="inline-block w-2 h-2 bg-indigo-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span>Detailed scoring with interview recommendations</span>
                  </div>
                </div>
              </div>

              {/* Analyze Button */}
              <button
                onClick={handleAnalyze}
                disabled={!file || analysis.analyzing}
                className={`
                  w-full py-4 px-6 rounded-lg text-lg font-semibold transition-all
                  ${!file || analysis.analyzing
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                  }
                `}
              >
                {analysis.analyzing ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    Analyzing with AI...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Zap className="h-6 w-6 mr-2" />
                    Start AI Analysis
                  </div>
                )}
              </button>

              {!file && (
                <div className="mt-4 flex items-center justify-center text-amber-600 bg-amber-50 rounded-lg p-3">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  <span className="text-sm">Please upload a resume to continue</span>
                </div>
              )}
            </div>
          </div>

          {/* Info Section */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-white rounded-lg p-6 shadow-md">
                <Upload className="h-8 w-8 text-indigo-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Smart Upload</h3>
                <p className="text-sm text-gray-600">
                  AI automatically extracts all relevant information including social media URLs
                </p>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-white rounded-lg p-6 shadow-md">
                <FileText className="h-8 w-8 text-indigo-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">URL Analysis</h3>
                <p className="text-sm text-gray-600">
                  Gemini AI reads job postings from any website and extracts requirements
                </p>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-white rounded-lg p-6 shadow-md">
                <Zap className="h-8 w-8 text-indigo-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Comprehensive Scoring</h3>
                <p className="text-sm text-gray-600">
                  Detailed analysis with strengths, weaknesses, and interview questions
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>

      <Toaster position="top-right" />
    </>
  )
} 