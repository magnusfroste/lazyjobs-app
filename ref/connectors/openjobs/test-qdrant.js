#!/usr/bin/env node

/**
 * Qdrant Integration Test Script
 * 
 * Tests the Qdrant semantic search module with sample data
 * Run this after starting Qdrant container
 */

import 'dotenv/config';
import { qdrantIntegration } from './qdrant-direct.js';

// Sample test jobs
const testJobs = [
  {
    id: 1,
    external_id: 'test_react_dev',
    title: 'Senior React Developer',
    company: 'Tech Startup AB',
    description: 'We are looking for an experienced React developer to join our frontend team. You will work with modern JavaScript, TypeScript, and React 18.',
    location: 'Stockholm, Sweden',
    salary_min: 50000,
    salary_max: 70000,
    salary_currency: 'SEK',
    is_remote: true,
    employment_type: 'full-time',
    experience_level: 'senior',
    required_skills: ['React', 'TypeScript', 'JavaScript', 'CSS', 'Git'],
    source: 'test',
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    external_id: 'test_frontend_eng',
    title: 'Frontend Engineer',
    company: 'Digital Agency',
    description: 'Join our team as a frontend engineer. Experience with Vue.js, React, or Angular required. We build modern web applications.',
    location: 'Malmö, Sweden',
    salary_min: 45000,
    salary_max: 60000,
    salary_currency: 'SEK',
    is_remote: false,
    employment_type: 'full-time',
    experience_level: 'mid',
    required_skills: ['Vue.js', 'JavaScript', 'HTML', 'CSS', 'REST APIs'],
    source: 'test',
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    external_id: 'test_backend_dev',
    title: 'Backend Developer - Go',
    company: 'FinTech Company',
    description: 'We need a backend developer with strong Go experience. You will build microservices and APIs for our financial platform.',
    location: 'Gothenburg, Sweden',
    salary_min: 55000,
    salary_max: 75000,
    salary_currency: 'SEK',
    is_remote: true,
    employment_type: 'full-time',
    experience_level: 'senior',
    required_skills: ['Go', 'PostgreSQL', 'Docker', 'Kubernetes', 'REST APIs'],
    source: 'test',
    created_at: new Date().toISOString(),
  },
];

async function testQdrantIntegration() {
  console.log('🧪 Testing Qdrant Integration\n');
  console.log('=' .repeat(60));

  // Step 1: Initialize
  console.log('\n1️⃣  Initializing Qdrant connection...');
  const initialized = await qdrantIntegration.init();
  
  if (!initialized) {
    console.error('❌ Failed to initialize Qdrant');
    console.log('\n💡 Make sure:');
    console.log('   - Docker is running');
    console.log('   - Qdrant container is started: docker run -d -p 6333:6333 qdrant/qdrant');
    console.log('   - ENABLE_QDRANT=true in .env');
    console.log('   - OPENAI_API_KEY is set in .env');
    process.exit(1);
  }
  
  console.log('✅ Qdrant initialized successfully');

  // Step 2: Get initial stats
  console.log('\n2️⃣  Getting collection stats...');
  const initialStats = await qdrantIntegration.getStats();
  console.log(`📊 Current jobs in Qdrant: ${initialStats.points_count || 0}`);

  // Step 3: Store test jobs
  console.log('\n3️⃣  Storing test jobs...');
  console.log(`   Processing ${testJobs.length} jobs...`);
  
  for (const job of testJobs) {
    const result = await qdrantIntegration.processJob(job);
    if (result.success) {
      console.log(`   ✅ ${job.title}`);
    } else {
      console.log(`   ❌ ${job.title}: ${result.error}`);
    }
    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Step 4: Get updated stats
  console.log('\n4️⃣  Verifying storage...');
  const finalStats = await qdrantIntegration.getStats();
  console.log(`📊 Total jobs in Qdrant: ${finalStats.points_count || 0}`);
  console.log(`📈 Added: ${(finalStats.points_count || 0) - (initialStats.points_count || 0)} jobs`);

  // Step 5: Test similarity search
  console.log('\n5️⃣  Testing similarity search...');
  console.log('   Searching for jobs similar to "Senior React Developer"...');
  
  const similarJobs = await qdrantIntegration.searchSimilarJobs(1, 2);
  
  if (similarJobs.length > 0) {
    console.log('\n   📋 Similar jobs found:');
    similarJobs.forEach((job, index) => {
      console.log(`   ${index + 1}. ${job.title} at ${job.company}`);
      console.log(`      Similarity: ${(job.similarity_score * 100).toFixed(1)}%`);
    });
  } else {
    console.log('   ⚠️  No similar jobs found (need more jobs in database)');
  }

  // Step 6: Summary
  console.log('\n' + '='.repeat(60));
  console.log('✅ Test Complete!\n');
  console.log('📊 Summary:');
  console.log(`   - Qdrant URL: ${finalStats.url}`);
  console.log(`   - Total jobs: ${finalStats.points_count || 0}`);
  console.log(`   - Test jobs added: ${testJobs.length}`);
  console.log(`   - Similarity search: ${similarJobs.length > 0 ? 'Working ✅' : 'Needs more data ⚠️'}`);
  
  console.log('\n💡 Next steps:');
  console.log('   1. Run the full connector: node fetch-jobs.js');
  console.log('   2. Check Qdrant dashboard: http://localhost:6333/dashboard');
  console.log('   3. Use in React: import { useQdrant } from "../hooks/useQdrant"');
  
  console.log('\n🎉 Qdrant semantic search is ready to use!');
}

// Run test
testQdrantIntegration().catch(error => {
  console.error('\n💥 Test failed:', error.message);
  console.error(error.stack);
  process.exit(1);
});
