import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { ArrowLeft, ArrowRight, Briefcase } from 'lucide-react'
import toast from 'react-hot-toast'
import { JobDescriptionForm as JobDescriptionFormType } from '@/types'

interface JobDescriptionFormProps {
  onSubmit: (data: any) => void
  onBack: () => void
}

export default function JobDescriptionForm({ onSubmit, onBack }: JobDescriptionFormProps) {
  const [isValidating, setIsValidating] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<JobDescriptionFormType>()

  const watchedDescription = watch('description', '')

  const onFormSubmit = async (data: JobDescriptionFormType) => {
    setIsValidating(true)

    try {
      // Convert comma-separated strings to arrays
      const jobDescription = {
        title: data.title,
        company: data.company,
        description: data.description,
        required_skills: data.required_skills ? data.required_skills.split(',').map(s => s.trim()) : [],
        preferred_skills: data.preferred_skills ? data.preferred_skills.split(',').map(s => s.trim()) : [],
        experience_level: data.experience_level,
        education_requirements: data.education_requirements ? data.education_requirements.split(',').map(s => s.trim()) : [],
        location: data.location,
      }

      // Validate with backend
      const response = await fetch('/api/validate-job-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobDescription),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Job description validated successfully!')
        onSubmit(jobDescription)
      } else {
        throw new Error(result.message || 'Validation failed')
      }
    } catch (error) {
      console.error('Validation error:', error)
      toast.error(error instanceof Error ? error.message : 'Validation failed')
    } finally {
      setIsValidating(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <Briefcase className="h-12 w-12 text-primary-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Job Description
        </h2>
        <p className="text-gray-600">
          Provide details about the position to match against the resume
        </p>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Job Title *
            </label>
            <input
              type="text"
              id="title"
              {...register('title', { required: 'Job title is required' })}
              className="input-field"
              placeholder="e.g., Senior Software Engineer"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
              Company *
            </label>
            <input
              type="text"
              id="company"
              {...register('company', { required: 'Company name is required' })}
              className="input-field"
              placeholder="e.g., Tech Corp Inc."
            />
            {errors.company && (
              <p className="mt-1 text-sm text-red-600">{errors.company.message}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Job Description *
          </label>
          <textarea
            id="description"
            rows={6}
            {...register('description', { 
              required: 'Job description is required',
              minLength: { value: 50, message: 'Description must be at least 50 characters' }
            })}
            className="input-field"
            placeholder="Describe the role, responsibilities, and requirements..."
          />
          <div className="flex justify-between items-center mt-1">
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
            <p className="text-sm text-gray-500 ml-auto">
              {watchedDescription.length} characters
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="required_skills" className="block text-sm font-medium text-gray-700 mb-2">
              Required Skills
            </label>
            <input
              type="text"
              id="required_skills"
              {...register('required_skills')}
              className="input-field"
              placeholder="Python, React, AWS (comma-separated)"
            />
            <p className="mt-1 text-sm text-gray-500">
              Separate skills with commas
            </p>
          </div>

          <div>
            <label htmlFor="preferred_skills" className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Skills
            </label>
            <input
              type="text"
              id="preferred_skills"
              {...register('preferred_skills')}
              className="input-field"
              placeholder="Docker, Kubernetes, GraphQL"
            />
            <p className="mt-1 text-sm text-gray-500">
              Separate skills with commas
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="experience_level" className="block text-sm font-medium text-gray-700 mb-2">
              Experience Level
            </label>
            <select
              id="experience_level"
              {...register('experience_level')}
              className="input-field"
            >
              <option value="">Select level</option>
              <option value="Entry">Entry Level (0-2 years)</option>
              <option value="Mid">Mid Level (3-5 years)</option>
              <option value="Senior">Senior Level (6-10 years)</option>
              <option value="Lead">Lead/Principal (10+ years)</option>
            </select>
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              id="location"
              {...register('location')}
              className="input-field"
              placeholder="e.g., San Francisco, CA or Remote"
            />
          </div>
        </div>

        <div>
          <label htmlFor="education_requirements" className="block text-sm font-medium text-gray-700 mb-2">
            Education Requirements
          </label>
          <input
            type="text"
            id="education_requirements"
            {...register('education_requirements')}
            className="input-field"
            placeholder="Bachelor's degree in Computer Science, Master's preferred"
          />
          <p className="mt-1 text-sm text-gray-500">
            Separate multiple requirements with commas
          </p>
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

          <button
            type="submit"
            disabled={isValidating}
            className="btn-primary flex items-center"
          >
            {isValidating ? (
              <>
                <div className="loading-spinner mr-2 h-4 w-4"></div>
                Validating...
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
} 