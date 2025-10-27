// @ts-nocheck
import { useState, useEffect } from 'react'
import { FileText, Briefcase, GraduationCap, TrendingUp, Plus, Edit, Upload, Save, X, Target, Zap } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { calculateSkillGaps, getGamificationMessage } from '../lib/skillGaps'
import type { SkillGap } from '../lib/skillGaps'

interface CVInsightsProps {
  cvData: any
  onReupload?: () => void
  userId: string
  onDataUpdate?: (data: any) => void
  jobStack?: any[] // Current jobs being shown to user
  showOnlyCV?: boolean // Show only CV data (My CV tab)
  showOnlyInsights?: boolean // Show only insights/gamification (Career Insights tab)
  onAddSkillsClick?: () => void // Callback to switch to CV tab
}

export default function CVInsights({ 
  cvData, 
  onReupload, 
  userId, 
  onDataUpdate, 
  jobStack = [],
  showOnlyCV = false,
  showOnlyInsights = false,
  onAddSkillsClick
}: CVInsightsProps) {
  const [showRaw, setShowRaw] = useState<boolean>(false)
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [editedData, setEditedData] = useState<any>(null)
  const [saving, setSaving] = useState<boolean>(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [skillGaps, setSkillGaps] = useState<SkillGap[]>([])

  // Simple check: if cvData is null/undefined or empty object
  if (!cvData || Object.keys(cvData).length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="text-center py-8">
          <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">No CV Data Found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Upload your CV to get personalized job matches and see what we extracted
          </p>
          <button
            onClick={onReupload}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
          >
            Upload CV
          </button>
        </div>
      </div>
    )
  }

  // Extract data with proper structure
  // Handle skills_flat (processed), technical_skills (n8n), or skills (legacy)
  let skills = cvData.skills_flat || []
  
  // If no flattened skills, try to flatten technical_skills or skills
  if (skills.length === 0) {
    const skillsData = cvData.technical_skills || cvData.skills
    if (skillsData) {
      const flattenSkills = (obj: any): string[] => {
        const allSkills: string[] = []
        const extract = (val: any): void => {
          if (Array.isArray(val)) allSkills.push(...val)
          else if (typeof val === 'object') Object.values(val).forEach(extract)
        }
        extract(obj)
        return [...new Set(allSkills)]
      }
      skills = flattenSkills(skillsData)
    }
  }
  const experience = cvData.experience_years || 'Not specified'
  
  // Format education: "Bachelor of Science in Computer Science, KTH"
  let education = 'Not specified'
  if (Array.isArray(cvData.education) && cvData.education.length > 0) {
    const edu = cvData.education[0]
    const parts = []
    if (edu.degree) parts.push(edu.degree)
    if (edu.field) parts.push(`in ${edu.field}`)
    if (edu.institution) parts.push(`@ ${edu.institution}`)
    education = parts.length > 0 ? parts.join(' ') : 'Not specified'
  } else if (cvData.education) {
    education = cvData.education
  }

  // Handle languages - convert objects to strings
  const languages = (cvData.languages || []).map((lang: any) =>
    typeof lang === 'string' ? lang : lang.language || lang.name || 'Unknown'
  )

  const targetRoles = cvData.target_roles || []
  const bio = cvData.bio || null
  const certifications = cvData.certifications || []
  const projects = cvData.projects || []
  const github = cvData.github || null
  const linkedin = cvData.linkedin || null

  // Calculate REAL skill gaps from job stack OR swipe history
  useEffect(() => {
    const fetchSkillGaps = async () => {
      if (skills.length === 0) return

      // Option 1: Use current job stack (if available)
      if (jobStack.length > 0) {
        const gaps = calculateSkillGaps(skills, jobStack, 5)
        setSkillGaps(gaps)
        return
      }

      // Option 2: Fallback to swipe history (last 50 jobs swiped)
      try {
        const { data: swipes, error } = await supabase
          .from('swipes')
          .select('job:jobs(*)')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50)

        if (error) throw error

        // Extract jobs from swipes (both left and right swipes!)
        const swipedJobs = swipes
          ?.map(s => s.job)
          .filter(job => job !== null) || []

        if (swipedJobs.length > 0) {
          const gaps = calculateSkillGaps(skills, swipedJobs, 5)
          setSkillGaps(gaps)
        }
      } catch (err) {
        console.error('Failed to fetch swipe history for skill gaps:', err)
      }
    }

    fetchSkillGaps()
  }, [skills, jobStack, userId])

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      {/* Header */}
      {!showOnlyInsights && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">My CV</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Your CV data at a glance</p>
            </div>
          </div>
          {onReupload && (
            <button
              onClick={onReupload}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200 transition"
            >
              <Upload className="w-4 h-4" />
              Re-upload
            </button>
          )}
        </div>
      )}

      {showOnlyInsights && (
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Career Insights</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">How to improve your profile</p>
          </div>
        </div>
      )}

      {/* Extracted Data - Only show in CV tab */}
      {!showOnlyInsights && (
        <div className="space-y-6">
        {/* Skills */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Briefcase className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">
              Extracted Skills ({isEditing && editedData ? editedData.skills_flat?.length || 0 : skills.length})
            </h3>
            {isEditing && (
              <button
                onClick={() => {
                  const newSkill = prompt('Add a skill:')
                  if (newSkill && newSkill.trim()) {
                    setEditedData((prev: any) => ({
                      ...prev,
                      skills_flat: [...(prev.skills_flat || []), newSkill.trim()]
                    }))
                  }
                }}
                className="ml-auto text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add Skill
              </button>
            )}
          </div>
          {(isEditing ? editedData?.skills_flat || [] : skills).length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {(isEditing ? editedData?.skills_flat || [] : skills).map((skill: string, idx: number) => (
                <span
                  key={idx}
                  className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${
                    isEditing
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 pr-1'
                      : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  }`}
                >
                  {skill}
                  {isEditing && (
                    <button
                      onClick={() => {
                        setEditedData((prev: any) => ({
                          ...prev,
                          skills_flat: prev.skills_flat.filter((_: any, i: number) => i !== idx)
                        }))
                      }}
                      className="hover:bg-red-200 dark:hover:bg-red-800 rounded-full p-0.5"
                      title="Remove skill"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">No skills extracted</p>
          )}
        </div>

        {/* Experience & Education */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Experience</span>
            </div>
            <p className="text-lg font-bold text-gray-800 dark:text-gray-100">
              {typeof experience === 'number' ? `${experience} years` : experience}
            </p>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Education</span>
            </div>
            <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{education}</p>
          </div>
        </div>

        {/* Target Roles */}
        {targetRoles.length > 0 && (
          <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Briefcase className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Target Roles</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {targetRoles.map((role: any, idx: number) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-medium"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Bio */}
        {bio && (
          <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">✨</span>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Professional Summary</span>
            </div>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{bio}</p>
          </div>
        )}

        {/* Languages */}
        {languages.length > 0 && (
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">🌍 Languages</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {languages.map((lang: string, idx: number) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-sm font-medium"
                >
                  {lang}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🏆</span>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Certifications & Achievements</span>
            </div>
            <div className="space-y-2">
              {certifications.map((cert: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="font-medium text-gray-800 dark:text-gray-100">{cert.name}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 px-3 py-1 rounded-full">
                    {cert.year}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <div className="p-4 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-lg border border-cyan-200 dark:border-cyan-800">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🚀</span>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Notable Projects</span>
            </div>
            <div className="space-y-3">
              {projects.map((project: any, idx: number) => (
                <div key={idx}>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">{project.name}</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {project.details.map((detail: any, detailIdx: number) => (
                      <li key={detailIdx} className="text-sm text-gray-600 dark:text-gray-400">
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Links */}
        {(github || linkedin) && (
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">🔗 Professional Links</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {github && (
                <a
                  href={github.startsWith('http') ? github : `https://${github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 dark:bg-gray-900 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-800 transition"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  GitHub
                </a>
              )}
              {linkedin && (
                <a
                  href={linkedin.startsWith('http') ? linkedin : `https://${linkedin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  LinkedIn
                </a>
              )}
            </div>
          </div>
        )}
        </div>
      )}

      {/* Career Insights - Only show in Insights tab */}
      {!showOnlyCV && skillGaps.length > 0 && (
          <div className="border-t pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-gray-800 dark:text-gray-100">🎯 Beat the ATS: Skills to Unlock More Jobs</h3>
            </div>
            <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>⚠️ Did you know?</strong> 75% of qualified candidates are rejected by ATS (Applicant Tracking Systems) due to keyword mismatches. These missing skills could be blocking 70% of your applications from reaching human recruiters.
              </p>
            </div>
            <div className="space-y-3">
              {skillGaps.map((gap, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border-2 transition-all hover:scale-[1.02] ${
                    gap.trending
                      ? 'bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-300 dark:border-orange-700'
                      : 'bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-300 dark:border-purple-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-gray-800 dark:text-gray-100">{gap.skill}</span>
                      {gap.trending && (
                        <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded-full font-bold animate-pulse">
                          🔥 TRENDING
                        </span>
                      )}
                      {gap.category && (
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-full font-medium">
                          {gap.category}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {getGamificationMessage(gap)}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        +{gap.unlockCount}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        jobs ({gap.percentage}% of stack)
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                        style={{ width: `${gap.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                💡 <strong>Pro tip:</strong> Learn these skills to unlock {skillGaps.reduce((sum, gap) => sum + gap.unlockCount, 0)} more job opportunities!
                {jobStack.length === 0 && ' (Based on your recent swipes - both left and right)'}
              </p>
            </div>
          </div>
        )}
      
      {/* No skill gaps - celebrate! - Only show in Insights tab */}
      {!showOnlyCV && jobStack.length > 0 && skillGaps.length === 0 && (
        <div className="border-t pt-6">
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border-2 border-green-300 dark:border-green-700">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">🎉</span>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Perfect Match!</h3>
            </div>
            <p className="text-gray-700 dark:text-gray-300">
              You have all the skills needed for the jobs in your current stack. Keep swiping to find more opportunities!
            </p>
          </div>
        </div>
      )}

      {/* Raw Data Toggle - Only in CV tab */}
      {!showOnlyInsights && (
        <div className="border-t pt-4">
          <button
            onClick={() => setShowRaw(!showRaw)}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            {showRaw ? 'Hide' : 'Show'} raw parsed data
          </button>

          {showRaw && (
            <div className="mt-3 p-4 bg-gray-900 rounded-lg overflow-x-auto">
              <pre className="text-xs text-green-400 font-mono">
                {JSON.stringify(cvData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-lg text-sm font-medium">
          {successMessage}
        </div>
      )}

      {/* Action Buttons - Only in CV tab */}
      {!showOnlyInsights && onReupload && (
        <div className="flex gap-3 mt-6 pt-6 border-t dark:border-gray-700">
          <button
            onClick={onReupload}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition"
          >
            Upload New CV
          </button>
        {!isEditing ? (
          <button
            onClick={() => {
              setIsEditing(true)
              setEditedData({ ...cvData })
            }}
            className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-3 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center justify-center gap-2"
          >
            <Edit className="w-5 h-5" />
            Edit Manually
          </button>
        ) : (
          <>
            <button
              onClick={async () => {
                setSaving(true)
                try {
                  const { error } = await supabase
                    .from('profiles')
                    .update({ cv_data: editedData })
                    .eq('id', userId)

                  if (error) throw error

                  // Update parent component with new data
                  if (onDataUpdate) {
                    onDataUpdate(editedData)
                  }
                  
                  // Exit edit mode and show success
                  setIsEditing(false)
                  setSuccessMessage('✅ Changes saved successfully!')
                  setTimeout(() => setSuccessMessage(null), 3000)
                } catch (error) {
                  console.error('Error saving CV data:', error)
                  alert('Failed to save changes. Please try again.')
                } finally {
                  setSaving(false)
                }
              }}
              disabled={saving}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={() => {
                setIsEditing(false)
                setEditedData(null)
              }}
              className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-3 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center justify-center gap-2"
            >
              <X className="w-5 h-5" />
              Cancel
            </button>
          </>
        )}
      </div>
      )}
    </div>
  )
}
