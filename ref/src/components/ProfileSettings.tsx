// @ts-nocheck
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
  Upload,
  User,
  MapPin,
  DollarSign,
  Briefcase,
  LogOut,
  X,
  Moon,
  Sun,
  FileText,
} from 'lucide-react'
import CVInsights from './CVInsights'
import { useTheme } from '../contexts/ThemeContext'
import { FEATURES } from '../lib/featureFlags'

interface ProfileSettingsProps {
  user: User
  onBack: () => void
  onLogout: () => void
  jobStack?: any[] // Current jobs being shown to user
}

export default function ProfileSettings({ user, onBack, onLogout, jobStack }: ProfileSettingsProps) {
  const { isDark, toggleTheme } = useTheme()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [activeTab, setActiveTab] = useState('settings') // 'settings', 'cv', or 'insights'

  // Form state
  const [fullName, setFullName] = useState('')
  const [location, setLocation] = useState('')
  const [salaryMin, setSalaryMin] = useState('')
  const [remoteOnly, setRemoteOnly] = useState(false)
  const [employmentTypes, setEmploymentTypes] = useState([])
  // ============ APPLICATION ASSISTANT FEATURE START ============
  const [autoOpenApplication, setAutoOpenApplication] = useState(false)
  const [applicationLanguage, setApplicationLanguage] = useState('auto')
  // ============ APPLICATION ASSISTANT FEATURE END ==============

  useEffect(() => {
    fetchProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (fetchError) {
        // If profile doesn't exist, create it
        if (fetchError.code === 'PGRST116') {
          const { error: insertError } = await supabase.from('profiles').insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || '',
            preferences: {},
          })

          if (insertError) throw insertError

          // Fetch again
          const { data: newData, error: refetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

          if (refetchError) throw refetchError

          setProfile(newData)
          setFullName(newData.full_name || '')
          return
        }
        throw fetchError
      }

      setProfile(data)
      setFullName(data.full_name || '')
      setLocation(data.preferences?.location || '')
      setSalaryMin(data.preferences?.salary_min || '')
      setRemoteOnly(data.preferences?.remote_only || false)
      setEmploymentTypes(data.preferences?.employment_types || [])
      // ============ APPLICATION ASSISTANT FEATURE START ============
      setAutoOpenApplication(data.preferences?.auto_open_application || false)
      setApplicationLanguage(data.application_language_preference || 'auto')
      // ============ APPLICATION ASSISTANT FEATURE END ==============
    } catch (err) {
      console.error('Error fetching profile:', err)
      setError(`Error loading profile: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCVUpload = async e => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file')
      return
    }

    try {
      setUploading(true)
      setError(null)
      setSuccess(null)

      // Delete old CV files first (cleanup)
      try {
        const { data: oldFiles } = await supabase.storage.from('cvs').list('', { search: user.id })

        if (oldFiles && oldFiles.length > 0) {
          const filesToDelete = oldFiles.map(f => f.name)
          await supabase.storage.from('cvs').remove(filesToDelete)
        }
      } catch (cleanupError) {
        console.warn('CV cleanup failed:', cleanupError)
      }

      // Upload new CV to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage.from('cvs').upload(fileName, file)

      if (uploadError) {
        throw new Error(
          `Upload failed: ${uploadError.message}. Please create a 'cvs' bucket in Supabase Storage.`
        )
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('cvs').getPublicUrl(fileName)

      // Send to n8n webhook
      const webhookUrl = import.meta.env.VITE_N8N_CV_WEBHOOK_URL

      if (!webhookUrl || webhookUrl.includes('your-n8n-instance')) {
        throw new Error(
          'N8N webhook URL not configured. Please set VITE_N8N_CV_WEBHOOK_URL in .env'
        )
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          cv_url: publicUrl,
          email: user.email,
          filename: file.name,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Webhook error:', errorText)
        throw new Error(`Failed to process CV: ${response.status} ${response.statusText}`)
      }

      // Check if response has content
      const responseText = await response.text()
      if (!responseText || responseText.trim() === '') {
        throw new Error('Webhook returned empty response')
      }

      let cvData
      try {
        cvData = JSON.parse(responseText)
      } catch (parseError) {
        console.error('Failed to parse JSON:', responseText)
        throw new Error('Webhook returned invalid JSON')
      }

      // Handle array response (n8n sometimes wraps in array)
      if (Array.isArray(cvData) && cvData.length > 0) {
        cvData = cvData[0].response || cvData[0]
      }

      // Flatten skills for easier matching
      // Handle both 'skills' and 'technical_skills' from n8n
      // If skills_flat already exists (new format), keep it
      const skillsData = cvData.technical_skills || cvData.skills
      const flattenedData = {
        ...cvData,
        skills_flat: cvData.skills_flat || flattenSkills(skillsData),
      }

      // Update profile with CV data
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ cv_data: flattenedData })
        .eq('id', user.id)

      if (updateError) throw updateError

      setSuccess('CV uploaded and processed successfully!')
      fetchProfile()
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleSavePreferences = async () => {
    try {
      setError(null)
      setSuccess(null)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          preferences: {
            location,
            salary_min: salaryMin ? parseInt(salaryMin) : null,
            remote_only: remoteOnly,
            employment_types: employmentTypes,
            // ============ APPLICATION ASSISTANT FEATURE START ============
            auto_open_application: autoOpenApplication,
            // ============ APPLICATION ASSISTANT FEATURE END ==============
          },
          // ============ APPLICATION ASSISTANT FEATURE START ============
          application_language_preference: applicationLanguage,
          // ============ APPLICATION ASSISTANT FEATURE END ==============
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      setSuccess('Preferences saved successfully!')
      fetchProfile()
    } catch (err) {
      console.error('Error saving preferences:', err)
      setError(err.message)
    }
  }

  const toggleEmploymentType = type => {
    setEmploymentTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  // Helper function to flatten nested skills structure
  const flattenSkills = skills => {
    if (!skills) return []

    const allSkills = []

    // Handle nested structure
    const extractSkills = obj => {
      if (Array.isArray(obj)) {
        allSkills.push(...obj)
      } else if (typeof obj === 'object') {
        Object.values(obj).forEach(value => extractSkills(value))
      }
    }

    extractSkills(skills)
    return [...new Set(allSkills)] // Remove duplicates
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
            Profile & Settings
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
              title={isDark ? 'Light mode' : 'Dark mode'}
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-gray-300" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600" />
              )}
            </button>
            <button
              onClick={onLogout}
              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-2"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 font-medium transition flex items-center gap-2 ${
              activeTab === 'settings'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <User className="w-4 h-4" />
            Settings
          </button>
          <button
            onClick={() => setActiveTab('cv')}
            className={`px-4 py-2 font-medium transition flex items-center gap-2 ${
              activeTab === 'cv'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            My CV
          </button>
          <button
            onClick={() => setActiveTab('insights')}
            className={`px-4 py-2 font-medium transition flex items-center gap-2 ${
              activeTab === 'insights'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Career Insights
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-start justify-between">
            <p>{error}</p>
            <button onClick={() => setError(null)}>
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg flex items-start justify-between">
            <p>{success}</p>
            <button onClick={() => setSuccess(null)}>
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'cv' ? (
          <CVInsights
            cvData={profile?.cv_data}
            userId={user.id}
            jobStack={jobStack}
            showOnlyCV={true}
            onReupload={() => {
              setActiveTab('settings')
              setTimeout(() => {
                document.getElementById('cv-upload')?.click()
              }, 100)
            }}
            onDataUpdate={(newData) => {
              // Update local profile state with new CV data
              setProfile(prev => ({
                ...prev,
                cv_data: newData
              }))
            }}
          />
        ) : activeTab === 'insights' ? (
          <CVInsights
            cvData={profile?.cv_data}
            userId={user.id}
            jobStack={jobStack}
            showOnlyInsights={true}
            onAddSkillsClick={() => setActiveTab('cv')}
            onDataUpdate={(newData) => {
              // Update local profile state with new CV data
              setProfile(prev => ({
                ...prev,
                cv_data: newData
              }))
            }}
          />
        ) : (
          <>
            {/* CV Upload */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload CV
              </h2>

              {profile?.cv_data ? (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-700 font-medium mb-2">✓ CV Uploaded</p>
                  {profile.cv_data.personal_info?.name && (
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      <strong>Name:</strong> {profile.cv_data.personal_info.name}
                    </div>
                  )}
                  {profile.cv_data.role && (
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      <strong>Role:</strong> {profile.cv_data.role}
                    </div>
                  )}
                  {profile.cv_data.experience_years && (
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      <strong>Experience:</strong> {profile.cv_data.experience_years} years
                    </div>
                  )}
                  {profile.cv_data.skills_flat && profile.cv_data.skills_flat.length > 0 && (
                    <div className="text-sm text-gray-600 mt-2">
                      <strong>Skills:</strong> {profile.cv_data.skills_flat.slice(0, 10).join(', ')}
                      {profile.cv_data.skills_flat.length > 10 &&
                        ` (+${profile.cv_data.skills_flat.length - 10} more)`}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Upload your CV to get better job matches powered by AI
                </p>
              )}

              <label className="block">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleCVUpload}
                  disabled={uploading}
                  className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                disabled:opacity-50"
                />
              </label>
              {uploading && (
                <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 flex-shrink-0 mt-0.5"></div>
                    <div>
                      <p className="font-semibold text-gray-800 mb-1">🧠 Analyzing your CV...</p>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        This takes 30-60 seconds, but it's worth it! We're extracting your skills,
                        experience, and matching you with the perfect jobs.
                      </p>
                      <p className="text-xs text-blue-600 mt-2 font-medium">
                        ☕ Grab a coffee, we'll be done in a moment!
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                  />
                </div>
              </div>
            </div>

            {/* Job Preferences */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Job Preferences
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Preferred Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="San Francisco, CA"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Minimum Salary (USD)
                  </label>
                  <input
                    type="number"
                    value={salaryMin}
                    onChange={e => setSalaryMin(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="100000"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={remoteOnly}
                      onChange={e => setRemoteOnly(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Remote jobs only
                    </span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Employment Types
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['full-time', 'part-time', 'contract', 'internship'].map(type => (
                      <button
                        key={type}
                        onClick={() => toggleEmploymentType(type)}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                          employmentTypes.includes(type)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={handleSavePreferences}
                className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Save Preferences
              </button>
            </div>

            {/* ============ APPLICATION ASSISTANT FEATURE START ============ */}
            {/* Application Assistant Settings */}
            {FEATURES.APPLICATION_ASSISTANT && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Application Assistant
                </h2>

                <div className="space-y-4">
                  {/* Auto-open preference */}
                  <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoOpenApplication}
                        onChange={e => setAutoOpenApplication(e.target.checked)}
                        className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                          Auto-open after match
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 block mt-1">
                          Automatically open application generator when you match with a job. If
                          disabled, you can apply later from your matches.
                        </span>
                      </div>
                    </label>
                  </div>

                  {/* Language preference */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Default Application Language
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setApplicationLanguage('auto')}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                          applicationLanguage === 'auto'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        🌍 Auto-detect
                      </button>
                      <button
                        onClick={() => setApplicationLanguage('en')}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                          applicationLanguage === 'en'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        🇬🇧 English
                      </button>
                      <button
                        onClick={() => setApplicationLanguage('sv')}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                          applicationLanguage === 'sv'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        🇸🇪 Swedish
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {applicationLanguage === 'auto'
                        ? "We'll detect the language from each job description"
                        : `Applications will always be generated in ${applicationLanguage === 'en' ? 'English' : 'Swedish'}`}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleSavePreferences}
                  className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Save Preferences
                </button>
              </div>
            )}
            {/* ============ APPLICATION ASSISTANT FEATURE END ============== */}
          </>
        )}
      </div>
    </div>
  )
}
