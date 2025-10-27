#!/usr/bin/env node

/**
 * Check jobs from today to see if enrichment is working
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://arqugyvmegxonaerjbzd.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFycXVneXZtZWd4b25hZXJqYnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMDQzMTUsImV4cCI6MjA3NTY4MDMxNX0.Giag4p4aIdmJxv4KYybJKby1nhP9VBfz47amTccEb_Q'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTodayJobs() {
  console.log('🔍 Checking jobs from TODAY for enrichment...\n')
  
  // Get today's date at midnight
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayISO = today.toISOString()
  
  console.log(`📅 Looking for jobs created after: ${today.toLocaleString()}\n`)
  
  // Get jobs from today
  const { data: jobs, error, count } = await supabase
    .from('jobs')
    .select('id, external_id, title, company, created_at, required_skills, metadata', { count: 'exact' })
    .eq('metadata->>source', 'arbetsformedlingen')
    .gte('created_at', todayISO)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('❌ Error:', error.message)
    return
  }
  
  if (!jobs || jobs.length === 0) {
    console.log('⚠️  No jobs found from today yet.')
    console.log('   Next cron run will create new jobs.')
    return
  }
  
  console.log(`📊 Found ${jobs.length} jobs from today!\n`)
  
  let enrichedCount = 0
  let totalSkills = 0
  let maxSkills = 0
  let minSkills = 999
  
  console.log('📋 Sample jobs:\n')
  
  jobs.slice(0, 15).forEach((job, i) => {
    const isEnriched = job.metadata?.ai_enriched === true
    const skillCount = job.required_skills?.length || 0
    const aiSkills = job.metadata?.ai_extracted_skills?.length || 0
    const aiLanguages = job.metadata?.ai_extracted_languages?.length || 0
    const aiTools = job.metadata?.ai_extracted_tools?.length || 0
    const softSkills = job.metadata?.ai_soft_skills?.length || 0
    
    if (isEnriched) enrichedCount++
    totalSkills += skillCount
    maxSkills = Math.max(maxSkills, skillCount)
    minSkills = Math.min(minSkills, skillCount)
    
    console.log(`${i + 1}. ${job.title}`)
    console.log(`   Company: ${job.company}`)
    console.log(`   Created: ${new Date(job.created_at).toLocaleTimeString()}`)
    console.log(`   Skills: ${skillCount} total ${isEnriched ? `(${aiSkills} AI skills, ${aiLanguages} languages, ${aiTools} tools, ${softSkills} soft)` : ''}`)
    console.log(`   AI Enriched: ${isEnriched ? '✅ YES' : '❌ NO'}`)
    
    if (skillCount > 0) {
      console.log(`   📝 Skills: ${job.required_skills.slice(0, 8).join(', ')}${skillCount > 8 ? '...' : ''}`)
    }
    console.log('')
  })
  
  // Summary
  console.log('═══════════════════════════════════════════════════════')
  console.log('📊 TODAY\'S SUMMARY:')
  console.log(`   Total jobs today: ${jobs.length}`)
  console.log(`   Enriched: ${enrichedCount}/${jobs.length} (${Math.round(enrichedCount/jobs.length*100)}%)`)
  console.log(`   Avg skills per job: ${(totalSkills/jobs.length).toFixed(1)}`)
  console.log(`   Min skills: ${minSkills === 999 ? 0 : minSkills}`)
  console.log(`   Max skills: ${maxSkills}`)
  console.log('═══════════════════════════════════════════════════════')
  
  if (enrichedCount === jobs.length) {
    console.log('\n🎉 SUCCESS! All jobs from today are AI-enriched!')
    console.log('✅ Easypanel cron + enrichment is working perfectly!')
  } else if (enrichedCount > 0) {
    console.log(`\n✅ Enrichment is working! ${enrichedCount} out of ${jobs.length} jobs enriched.`)
    console.log('   Some jobs may have been added before enrichment was enabled.')
  } else {
    console.log('\n⚠️  No enrichment detected in today\'s jobs.')
    console.log('   Check if ENABLE_ENRICHMENT=true in Easypanel environment.')
  }
  
  // Show enrichment details for first enriched job
  const enrichedJob = jobs.find(j => j.metadata?.ai_enriched)
  if (enrichedJob) {
    console.log('\n📊 Sample Enrichment Details:')
    console.log(`   Job: ${enrichedJob.title}`)
    console.log(`   AI Skills: ${enrichedJob.metadata.ai_extracted_skills?.join(', ') || 'none'}`)
    console.log(`   Languages: ${enrichedJob.metadata.ai_extracted_languages?.join(', ') || 'none'}`)
    console.log(`   Tools: ${enrichedJob.metadata.ai_extracted_tools?.join(', ') || 'none'}`)
    console.log(`   Soft Skills: ${enrichedJob.metadata.ai_soft_skills?.join(', ') || 'none'}`)
    console.log(`   Confidence: ${enrichedJob.metadata.ai_confidence || 'N/A'}`)
  }
}

checkTodayJobs().catch(console.error)
