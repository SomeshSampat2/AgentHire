import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, AlertCircle, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface ResumeUploadProps {
  onMultiUploadSuccess?: (files: File[]) => void
}

export default function ResumeUpload({ 
  onMultiUploadSuccess
}: ResumeUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newFiles = [...uploadedFiles, ...acceptedFiles].slice(0, 10) // Max 10 files
    setUploadedFiles(newFiles)
    
    if (newFiles.length > uploadedFiles.length) {
      toast.success(`${acceptedFiles.length} resume(s) added! Total: ${newFiles.length}`)
    }
    
    if (onMultiUploadSuccess) {
      onMultiUploadSuccess(newFiles)
    }
  }, [onMultiUploadSuccess, uploadedFiles])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    maxFiles: 10,
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true
  })

  const removeFile = (indexToRemove: number) => {
    const newFiles = uploadedFiles.filter((_, index) => index !== indexToRemove)
    setUploadedFiles(newFiles)
    if (onMultiUploadSuccess) {
      onMultiUploadSuccess(newFiles)
    }
    toast.success('File removed')
  }

  const clearAllFiles = () => {
    setUploadedFiles([])
    if (onMultiUploadSuccess) {
      onMultiUploadSuccess([])
    }
    toast.success('All files cleared')
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Upload Resume{uploadedFiles.length !== 1 ? 's' : ''}
        </h2>
        <p className="text-gray-600 mb-4">
          Upload one or multiple resumes (max 10) to analyze candidates for the job
        </p>
      </div>

      {/* File Upload Area */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive 
            ? 'border-primary-500 bg-primary-50' 
            : 'border-gray-300 hover:border-primary-400'
          }
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center">
          <Upload className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-2">
            {isDragActive ? 'Drop the files here' : 'Drag & drop resumes'}
          </p>
          <p className="text-gray-600 mb-4">
            or click to select files (max 10)
          </p>
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
            <span>PDF</span>
            <span>•</span>
            <span>DOCX</span>
            <span>•</span>
            <span>TXT</span>
            <span>•</span>
            <span>Max 10MB each</span>
          </div>
          {uploadedFiles.length > 0 && (
            <p className="mt-4 text-sm text-primary-600 font-medium">
              {uploadedFiles.length}/10 files uploaded
            </p>
          )}
        </div>
      </div>

      {/* File List */}
      {uploadedFiles.length > 0 && (
        <div className="mt-6 bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Uploaded Resumes ({uploadedFiles.length})
            </h3>
            <button
              onClick={clearAllFiles}
              className="text-sm text-red-600 hover:text-red-800 transition-colors"
            >
              Clear All
            </button>
          </div>
          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tips Section */}
      {uploadedFiles.length === 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">Tips for best results:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Use well-formatted resumes with clear sections</li>
                <li>Include contact information, skills, and experience</li>
                <li>PDF format typically provides the best parsing results</li>
                <li>Upload multiple resumes to compare candidates for the same position</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 