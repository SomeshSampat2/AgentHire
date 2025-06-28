import { useState } from 'react'
import { Trophy, Medal, Award, Star, ChevronRight, Users, TrendingUp, Target } from 'lucide-react'
import { MultiCandidateAnalysis, CandidateRanking as CandidateRankingType } from '@/types'

interface CandidateRankingProps {
  multiAnalysis: MultiCandidateAnalysis
  onCandidateSelect: (candidateId: string) => void
  onNewAnalysis: () => void
}

export default function CandidateRanking({ 
  multiAnalysis, 
  onCandidateSelect,
  onNewAnalysis 
}: CandidateRankingProps) {
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null)

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />
      default:
        return (
          <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
            {rank}
          </div>
        )
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    if (score >= 60) return 'text-orange-600'
    return 'text-red-600'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100'
    if (score >= 70) return 'bg-yellow-100'
    if (score >= 60) return 'bg-orange-100'
    return 'bg-red-100'
  }

  const handleCandidateClick = (candidateId: string) => {
    setSelectedCandidate(candidateId)
    onCandidateSelect(candidateId)
  }

  const formatScore = (score: number) => Math.round(score * 10) / 10

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <Users className="h-12 w-12 text-indigo-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {multiAnalysis.total_candidates === 1 ? 'Analysis Results' : 'Candidate Rankings'}
        </h2>
        <p className="text-gray-600">
          {multiAnalysis.total_candidates} {multiAnalysis.total_candidates === 1 ? 'candidate' : 'candidates'} analyzed for{' '}
          <span className="font-semibold text-indigo-600">
            {multiAnalysis.job_description.title}
          </span>{' '}
          at{' '}
          <span className="font-semibold">
            {multiAnalysis.job_description.company}
          </span>
        </p>
      </div>

      {/* Analysis Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <TrendingUp className="h-8 w-8 text-blue-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">
            {formatScore(multiAnalysis.analysis_summary.average_score)}
          </p>
          <p className="text-sm text-gray-600">
            {multiAnalysis.total_candidates === 1 ? 'Overall Score' : 'Average Score'}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">
            {formatScore(multiAnalysis.analysis_summary.highest_score)}
          </p>
          <p className="text-sm text-gray-600">
            {multiAnalysis.total_candidates === 1 ? 'Job Fit Score' : 'Highest Score'}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <Star className="h-8 w-8 text-green-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">
            {multiAnalysis.analysis_summary.candidates_above_80}
          </p>
          <p className="text-sm text-gray-600">Excellent Fit (80+)</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <Target className="h-8 w-8 text-orange-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">
            {multiAnalysis.analysis_summary.candidates_above_70}
          </p>
          <p className="text-sm text-gray-600">Strong Fit (70+)</p>
        </div>
      </div>

      {/* Candidate Rankings List */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {multiAnalysis.total_candidates === 1 ? 'Candidate Details' : 'Ranked Candidates'}
          </h3>
          <p className="text-sm text-gray-600">
            {multiAnalysis.total_candidates === 1 
              ? 'Click to view detailed analysis' 
              : 'Click on any candidate to view detailed analysis'
            }
          </p>
        </div>
        
        <div className="divide-y divide-gray-200">
          {multiAnalysis.candidate_rankings.map((candidate) => (
            <div
              key={candidate.candidate_id}
              onClick={() => handleCandidateClick(candidate.candidate_id)}
              className={`p-6 hover:bg-gray-50 cursor-pointer transition-colors ${
                selectedCandidate === candidate.candidate_id ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  {/* Rank Icon */}
                  <div className="flex-shrink-0">
                    {getRankIcon(candidate.rank)}
                  </div>
                  
                  {/* Candidate Info */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-medium text-gray-900">
                        {candidate.candidate_name}
                      </h4>
                      <div className="flex items-center space-x-3">
                        <div className={`px-3 py-1 rounded-full ${getScoreBgColor(candidate.total_score)}`}>
                          <span className={`text-sm font-medium ${getScoreColor(candidate.total_score)}`}>
                            {formatScore(candidate.total_score)}/100
                          </span>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">{candidate.filename}</p>
                    <p className="text-sm text-gray-700 mb-3">{candidate.brief_summary}</p>
                    
                    {/* Key Strengths */}
                    {candidate.key_strengths.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">KEY STRENGTHS:</p>
                        <div className="flex flex-wrap gap-2">
                          {candidate.key_strengths.map((strength, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                            >
                              {strength}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4 mt-8">
        <button
          onClick={onNewAnalysis}
          className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          New Analysis
        </button>
      </div>

      {/* Instructions */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-start">
          <Target className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">How to use this ranking:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Candidates are ranked by their overall job fit score</li>
              <li>Click on any candidate to view their detailed analysis</li>
              <li>Scores of 80+ indicate excellent fit, 70+ indicate strong potential</li>
              <li>Review key strengths to quickly identify top talent</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 