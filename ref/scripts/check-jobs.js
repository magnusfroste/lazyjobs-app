#!/usr/bin/env node

/**
 * Check if Arbetsförmedlingen jobs are being ingested with enrichment
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://arqugyvmegxonaerjbzd.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFycXVneXZtZWd4b25hZXJqYnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMDQzMTUsImV4cCI6MjA3NTY4MDMxNX0.Giag4p4aIdmJxv4KYybJKby1nhP9VBfz47amTccEb_Q'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkJobs() {
  console.log('🔍 Checking Arbetsförmedlingen jobs in database...\n')
  
  // Get total count
  const { count: totalCount } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('metadata->>source', 'arbetsformedlingen')
  
  console.log(`📊 Total Arbetsförmedlingen jobs: ${totalCount || 0}`)
  
  // Get recent jobs with enrichment data
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('id, external_id, title, company, created_at, required_skills, metadata')
    .eq('metadata->>source', 'arbetsformedlingen')
    .order('created_at', { ascending: false })
    .limit(10)
  
  if (error) {
    console.error('❌ Error:', error.message)
    return
  }
  
  if (!jobs || jobs.length === 0) {
    console.log('\n⚠️  No jobs found! The cron job may not be running.')
    console.log('\nTroubleshooting:')
    console.log('1. Check if Easypanel cron is configured')
    console.log('2. Check connector logs in Easypanel')
    console.log('3. Verify CONNECTOR_API_KEY is set correctly')
    return
  }
  
  console.log(`\n📋 Latest ${jobs.length} jobs:\n`)
  
  let enrichedCount = 0
  let totalSkills = 0
  
  jobs.forEach((job, i) => {
    const isEnriched = job.metadata?.ai_enriched === true
    const skillCount = job.required_skills?.length || 0
    const aiSkills = job.metadata?.ai_extracted_skills?.length || 0
    
    if (isEnriched) enrichedCount++
    totalSkills += skillCount
    
    console.log(`${i + 1}. ${job.title} @ ${job.company}`)
    console.log(`   ID: ${job.external_id}`)
    console.log(`   Created: ${new Date(job.created_at).toLocaleString()}`)
    console.log(`   Skills: ${skillCount} total${isEnriched ? ` (${aiSkills} AI-extracted)` : ''}`)
    console.log(`   AI Enriched: ${isEnriched ? '✅ YES' : '❌ NO'}`)
    
    if (skillCount > 0) {
      console.log(`   Sample skills: ${job.required_skills.slice(0, 5).join(', ')}`)
    }
    console.log('')
  })
  
  // Summary
  console.log('═══════════════════════════════════════')
  console.log('📊 Summary:')
  console.log(`   Total jobs: ${totalCount}`)
  console.log(`   Enriched: ${enrichedCount}/${jobs.length} (${Math.round(enrichedCount/jobs.length*100)}%)`)
  console.log(`   Avg skills per job: ${(totalSkills/jobs.length).toFixed(1)}`)
  
  const latestJob = jobs[0]
  const timeSinceLastSync = Date.now() - new Date(latestJob.created_at).getTime()
  const hoursSinceSync = Math.floor(timeSinceLastSync / (1000 * 60 * 60))
  const minutesSinceSync = Math.floor((timeSinceLastSync % (1000 * 60 * 60)) / (1000 * 60))
  
  console.log(`   Last sync: ${hoursSinceSync}h ${minutesSinceSync}m ago`)
  console.log('═══════════════════════════════════════')
  
  // Check if cron is working
  if (hoursSinceSync > 7) {
    console.log('\n⚠️  WARNING: Last sync was over 7 hours ago!')
    console.log('   The cron job may not be running. Expected: every 6 hours')
    console.log('\n   Action items:')
    console.log('   1. Check Easypanel logs for errors')
    console.log('   2. Verify cron schedule is set to: 0 */6 * * *')
    console.log('   3. Check if container is running')
  } else {
    console.log('\n✅ Cron job appears to be working! (Last sync < 7 hours ago)')
  }
  
  // Check enrichment status
  if (enrichedCount === 0) {
    console.log('\n⚠️  WARNING: No jobs are AI-enriched!')
    console.log('   ENABLE_ENRICHMENT may be set to false')
    console.log('   Or the n8n webhook may be failing')
    console.log('\n   Check connector .env file:')
    console.log('   ENABLE_ENRICHMENT=true')
    console.log('   ENRICHMENT_URL=https://agent.froste.eu/webhook/enrich-jobs')
  } else if (enrichedCount < jobs.length) {
    console.log('\n⚠️  Some jobs are not enriched. This may be normal if:')
    console.log('   - Enrichment was recently enabled')
    console.log('   - Some enrichment requests failed')
  } else {
    console.log('\n✅ All recent jobs are AI-enriched!')
  }
}

checkJobs().catch(console.error)
