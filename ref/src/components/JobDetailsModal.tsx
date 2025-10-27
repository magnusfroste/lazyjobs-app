import { X, MapPin, DollarSign, Briefcase, Clock, ExternalLink } from 'lucide-react'
import type { Job } from '../types'

interface JobDetailsModalProps {
  job: Job | null
  onClose: () => void
}

export default function JobDetailsModal({ job, onClose }: JobDetailsModalProps) {
  if (!job) return null

  const formatSalary = (min?: number, max?: number, currency?: string): string | null => {
    if (!min && !max) return null
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 0,
    })
    if (min && max) {
      return `${formatter.format(min)} - ${formatter.format(max)}`
    }
    return formatter.format(min || max || 0)
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl z-50 max-w-lg mx-auto max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex-1 pr-3">
            <h2 className="text-xl font-bold text-gray-800 leading-tight mb-1">{job.title}</h2>
            <p className="text-base text-gray-600">{job.company}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/50 text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Location & Remote */}
          <div className="flex items-center gap-2 text-gray-700">
            <MapPin className="w-5 h-5 flex-shrink-0" />
            <span>{job.location || 'Location not specified'}</span>
            {job.is_remote && (
              <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                Remote
              </span>
            )}
          </div>

          {/* Salary */}
          {(job.salary_min || job.salary_max) && (
            <div className="flex items-center gap-2 text-gray-700">
              <DollarSign className="w-5 h-5 flex-shrink-0" />
              <span className="font-semibold">
                {formatSalary(job.salary_min, job.salary_max, job.salary_currency)}
              </span>
            </div>
          )}

          {/* Employment Type & Experience */}
          <div className="flex items-center gap-4 text-gray-700">
            {job.employment_type && (
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 flex-shrink-0" />
                <span className="capitalize">{job.employment_type}</span>
              </div>
            )}
            {job.experience_level && (
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 flex-shrink-0" />
                <span className="capitalize">{job.experience_level}</span>
              </div>
            )}
          </div>

          {/* Skills - All of them */}
          {job.required_skills && job.required_skills.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {job.required_skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Full Description */}
          {/* TODO: Migrate to Markdown rendering when OpenJobs converts HTML→Markdown */}
          {job.description && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Description</h3>
              <div
                className="text-gray-600 text-sm leading-relaxed prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: job.description }}
              />
            </div>
          )}

          {/* View Original Link */}
          {job.url && (
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              View Original Posting
            </a>
          )}
        </div>

        {/* Footer with CTA */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
          >
            Back to Swiping
          </button>
        </div>
      </div>
    </>
  )
}
