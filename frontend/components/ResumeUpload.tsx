import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface ResumeUploadProps {
  onUploadSuccess: (fileId: string) => void
}

export default function ResumeUpload({ onUploadSuccess }: ResumeUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setIsUploading(true)
    setUploadedFile(file)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload-resume', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Resume uploaded successfully!')
        onUploadSuccess(result.file_id)
      } else {
        throw new Error(result.message || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Upload failed')
      setUploadedFile(null)
    } finally {
      setIsUploading(false)
    }
  }, [onUploadSuccess])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  })

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Upload Resume
        </h2>
        <p className="text-gray-600">
          Upload a resume in PDF, DOCX, or TXT format to get started
        </p>
      </div>

      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive 
            ? 'border-primary-500 bg-primary-50' 
            : 'border-gray-300 hover:border-primary-400'
          }
          ${isUploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center">
          {isUploading ? (
            <>
              <div className="loading-spinner mb-4"></div>
              <p className="text-lg font-medium text-gray-900 mb-2">
                Uploading and parsing resume...
              </p>
              <p className="text-gray-600">
                This may take a few moments
              </p>
            </>
          ) : uploadedFile ? (
            <>
              <FileText className="h-12 w-12 text-green-500 mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                ✅ {uploadedFile.name}
              </p>
              <p className="text-gray-600">
                Resume uploaded successfully!
              </p>
            </>
          ) : (
            <>
              <Upload className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                {isDragActive ? 'Drop the file here' : 'Drag & drop your resume'}
              </p>
              <p className="text-gray-600 mb-4">
                or click to select a file
              </p>
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                <span>PDF</span>
                <span>•</span>
                <span>DOCX</span>
                <span>•</span>
                <span>TXT</span>
                <span>•</span>
                <span>Max 10MB</span>
              </div>
            </>
          )}
        </div>
      </div>

      {!uploadedFile && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">Tips for best results:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Use a well-formatted resume with clear sections</li>
                <li>Include contact information, skills, and experience</li>
                <li>PDF format typically provides the best parsing results</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 