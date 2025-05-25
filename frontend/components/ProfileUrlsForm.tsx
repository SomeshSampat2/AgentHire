import { useForm } from 'react-hook-form'
import { ArrowLeft, ArrowRight, Users, Linkedin, Github, Globe } from 'lucide-react'
import { ProfileUrlsForm as ProfileUrlsFormType } from '@/types'

interface ProfileUrlsFormProps {
  onSubmit: (data: any) => void
  onBack: () => void
  onSkip: () => void
}

export default function ProfileUrlsForm({ onSubmit, onBack, onSkip }: ProfileUrlsFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ProfileUrlsFormType>()

  const watchedUrls = watch()
  const hasAnyUrl = watchedUrls.linkedin_url || watchedUrls.github_url || watchedUrls.portfolio_url

  const onFormSubmit = (data: ProfileUrlsFormType) => {
    onSubmit(data)
  }

  const validateUrl = (value: string) => {
    if (!value) return true // Optional field
    try {
      new URL(value)
      return true
    } catch {
      return 'Please enter a valid URL'
    }
  }

  const validateLinkedInUrl = (value: string) => {
    if (!value) return true
    const urlValidation = validateUrl(value)
    if (urlValidation !== true) return urlValidation
    
    if (!value.includes('linkedin.com')) {
      return 'Please enter a valid LinkedIn URL'
    }
    return true
  }

  const validateGitHubUrl = (value: string) => {
    if (!value) return true
    const urlValidation = validateUrl(value)
    if (urlValidation !== true) return urlValidation
    
    if (!value.includes('github.com')) {
      return 'Please enter a valid GitHub URL'
    }
    return true
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <Users className="h-12 w-12 text-primary-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Profile Enrichment
        </h2>
        <p className="text-gray-600">
          Add social media profiles to enhance the candidate analysis (optional)
        </p>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        <div className="space-y-6">
          <div>
            <label htmlFor="linkedin_url" className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Linkedin className="h-4 w-4 mr-2 text-blue-600" />
              LinkedIn Profile
            </label>
            <input
              type="url"
              id="linkedin_url"
              {...register('linkedin_url', { validate: validateLinkedInUrl })}
              className="input-field"
              placeholder="https://linkedin.com/in/username"
            />
            {errors.linkedin_url && (
              <p className="mt-1 text-sm text-red-600">{errors.linkedin_url.message}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              We'll analyze professional experience, skills, and endorsements
            </p>
          </div>

          <div>
            <label htmlFor="github_url" className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Github className="h-4 w-4 mr-2 text-gray-800" />
              GitHub Profile
            </label>
            <input
              type="url"
              id="github_url"
              {...register('github_url', { validate: validateGitHubUrl })}
              className="input-field"
              placeholder="https://github.com/username"
            />
            {errors.github_url && (
              <p className="mt-1 text-sm text-red-600">{errors.github_url.message}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              We'll analyze repositories, languages, and contribution activity
            </p>
          </div>

          <div>
            <label htmlFor="portfolio_url" className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Globe className="h-4 w-4 mr-2 text-green-600" />
              Portfolio Website
            </label>
            <input
              type="url"
              id="portfolio_url"
              {...register('portfolio_url', { validate: validateUrl })}
              className="input-field"
              placeholder="https://yourportfolio.com"
            />
            {errors.portfolio_url && (
              <p className="mt-1 text-sm text-red-600">{errors.portfolio_url.message}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              We'll analyze projects, technologies, and presentation quality
            </p>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">
            How Profile Enrichment Works
          </h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• LinkedIn: Professional experience and skill endorsements (+20 points max)</li>
            <li>• GitHub: Code quality and technical contributions (+15 points max)</li>
            <li>• Portfolio: Project showcase and presentation (+10 points max)</li>
          </ul>
        </div>

        <div className="flex justify-between pt-6">
          <button
            type="button"
            onClick={onBack}
            className="btn-secondary flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onSkip}
              className="btn-secondary"
            >
              Skip This Step
            </button>

            <button
              type="submit"
              className="btn-primary flex items-center"
              disabled={!hasAnyUrl}
            >
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </button>
          </div>
        </div>

        {!hasAnyUrl && (
          <p className="text-center text-sm text-gray-500 mt-4">
            Enter at least one URL to continue, or skip this step
          </p>
        )}
      </form>
    </div>
  )
} 