import { CheckCircle, Upload, FileText, Users, BarChart3 } from 'lucide-react'

interface ProgressStepsProps {
  currentStep: number
}

const steps = [
  { id: 1, name: 'Upload Resume', icon: Upload },
  { id: 2, name: 'Job Description', icon: FileText },
  { id: 3, name: 'Profile URLs', icon: Users },
  { id: 4, name: 'Analysis Results', icon: BarChart3 },
]

export default function ProgressSteps({ currentStep }: ProgressStepsProps) {
  return (
    <div className="mb-8">
      <nav aria-label="Progress">
        <ol className="flex items-center justify-center space-x-4 md:space-x-8">
          {steps.map((step, stepIdx) => {
            const isCompleted = step.id < currentStep
            const isCurrent = step.id === currentStep
            const Icon = step.icon

            return (
              <li key={step.name} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`
                      flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors
                      ${isCompleted
                        ? 'border-primary-600 bg-primary-600 text-white'
                        : isCurrent
                        ? 'border-primary-600 bg-white text-primary-600'
                        : 'border-gray-300 bg-white text-gray-400'
                      }
                    `}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <span
                    className={`
                      mt-2 text-sm font-medium transition-colors
                      ${isCompleted || isCurrent
                        ? 'text-primary-600'
                        : 'text-gray-500'
                      }
                    `}
                  >
                    {step.name}
                  </span>
                </div>
                {stepIdx < steps.length - 1 && (
                  <div
                    className={`
                      ml-4 h-0.5 w-8 md:w-16 transition-colors
                      ${isCompleted
                        ? 'bg-primary-600'
                        : 'bg-gray-300'
                      }
                    `}
                  />
                )}
              </li>
            )
          })}
        </ol>
      </nav>
    </div>
  )
} 