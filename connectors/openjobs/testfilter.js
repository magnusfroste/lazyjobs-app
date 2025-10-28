// Test the pre-filtering logic without running the full connector
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const INGEST_URL = process.env.INGEST_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY

async function testPrefilter() {
  console.log('🧪 Testing Pre-Filter Logic\n')
  
  // Get some sample external_ids from your database
  const supabaseUrl = INGEST_URL.split('/functions')[0]
  const supabase = createClient(supabaseUrl, SUPABASE_ANON_KEY)
  
  console.log('📊 Step 1: Fetching sample external_ids from database...')
  const { data: sampleJobs, error: fetchError } = await supabase
    .from('jobs')
    .select('external_id')
    .limit(10)
  
  if (fetchError) {
    console.error('❌ Error fetching sample jobs:', fetchError)
    return
  }
  
  const sampleExternalIds = sampleJobs.map(j => j.external_id)
  console.log(`✅ Got ${sampleExternalIds.length} sample external_ids`)
  console.log('   Sample IDs:', sampleExternalIds.slice(0, 3))
  
  // Test 1: Small batch (should work)
  console.log('\n🔬 Test 1: Small batch (10 IDs)...')
  const { data: result1, error: error1 } = await supabase
    .from('jobs')
    .select('external_id')
    .in('external_id', sampleExternalIds)
  
  console.log(error1 ? `❌ Error: ${error1.message}` : `✅ Success: Found ${result1.length} matches`)
  
  // Test 2: Large batch (simulate 1061 IDs)
  console.log('\n🔬 Test 2: Large batch (1061 fake IDs)...')
  const largeArray = Array.from({ length: 1061 }, (_, i) => `fake-id-${i}`)
  
  const { data: result2, error: error2 } = await supabase
    .from('jobs')
    .select('external_id')
    .in('external_id', largeArray)
  
  console.log(error2 ? `❌ Error: ${error2.message}` : `✅ Success: Found ${result2.length} matches`)
  
  if (error2) {
    console.log('\n💡 Full error details:', JSON.stringify(error2, null, 2))
  }
  
  // Test 3: Batched approach
  console.log('\n🔬 Test 3: Batched approach (1061 IDs in chunks of 100)...')
  const batchSize = 100
  const allMatches = []
  
  for (let i = 0; i < largeArray.length; i += batchSize) {
    const batch = largeArray.slice(i, i + batchSize)
    const { data, error } = await supabase
      .from('jobs')
      .select('external_id')
      .in('external_id', batch)
    
    if (error) {
      console.log(`   ❌ Batch ${Math.floor(i/batchSize) + 1} failed: ${error.message}`)
    } else {
      console.log(`   ✅ Batch ${Math.floor(i/batchSize) + 1}: ${data.length} matches`)
      allMatches.push(...data)
    }
  }
  
  console.log(`\n📊 Total matches found: ${allMatches.length}`)
}

testPrefilter().catch(console.error)
