#!/usr/bin/env node

/**
 * Test the n8n enrichment webhook
 */

import fetch from 'node-fetch'

const ENRICHMENT_URL = 'https://agent.froste.eu/webhook/enrich-jobs'

async function testEnrichment() {
  console.log('🧪 Testing n8n enrichment webhook...\n')
  console.log(`URL: ${ENRICHMENT_URL}\n`)
  
  const testPayload = {
    jobs: [
      {
        id: 'test-123',
        title: 'Senior Full Stack Developer',
        description: 'We are looking for an experienced developer with strong skills in React, Node.js, TypeScript, and PostgreSQL. You should have experience with AWS, Docker, and CI/CD pipelines. Knowledge of GraphQL and microservices architecture is a plus.',
        occupation: 'Software Developer',
        existing_skills: ['React', 'Node.js']
      }
    ]
  }
  
  console.log('📤 Sending test payload:')
  console.log(JSON.stringify(testPayload, null, 2))
  console.log('\n⏳ Waiting for response...\n')
  
  try {
    const startTime = Date.now()
    
    const response = await fetch(ENRICHMENT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload)
    })
    
    const duration = Date.now() - startTime
    
    console.log(`⏱️  Response time: ${duration}ms`)
    console.log(`📊 Status: ${response.status} ${response.statusText}\n`)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Error response:')
      console.error(errorText)
      console.log('\n🔍 Troubleshooting:')
      console.log('1. Check if n8n webhook is active')
      console.log('2. Verify webhook URL is correct')
      console.log('3. Check n8n workflow logs')
      return
    }
    
    const data = await response.json()
    console.log('✅ Success! Response:')
    console.log(JSON.stringify(data, null, 2))
    
    // Parse response
    const enriched_jobs = Array.isArray(data) 
      ? data[0]?.enriched_jobs 
      : data.enriched_jobs
    
    if (enriched_jobs && enriched_jobs.length > 0) {
      const job = enriched_jobs[0]
      console.log('\n📊 Enrichment results:')
      console.log(`   Extracted skills: ${job.extracted_skills?.length || 0}`)
      console.log(`   Languages: ${job.extracted_languages?.length || 0}`)
      console.log(`   Tools: ${job.extracted_tools?.length || 0}`)
      console.log(`   Soft skills: ${job.soft_skills?.length || 0}`)
      console.log(`   Confidence: ${job.confidence || 'N/A'}`)
      
      if (job.extracted_skills?.length > 0) {
        console.log(`\n   Skills found: ${job.extracted_skills.join(', ')}`)
      }
    }
    
    console.log('\n✅ Enrichment webhook is working correctly!')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.log('\n🔍 Troubleshooting:')
    console.log('1. Check if n8n server is running')
    console.log('2. Verify network connectivity')
    console.log('3. Check if webhook URL is accessible')
  }
}

testEnrichment()
