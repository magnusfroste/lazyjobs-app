// n8n Code Node - Flatten AI Response (CORRECT VERSION)
// Handles markdown code blocks properly

const aiResponse = $input.first().json;
const text = aiResponse.content.parts[0].text;

console.log('📥 Received text length:', text.length);

// Remove markdown code blocks - use greedy matching!
let jsonString = text;

// Try to extract JSON from markdown code block
if (text.includes('```json')) {
  const startMarker = '```json\n';
  const endMarker = '\n```';
  
  const startIndex = text.indexOf(startMarker);
  const endIndex = text.lastIndexOf(endMarker); // Use lastIndexOf!
  
  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    jsonString = text.substring(startIndex + startMarker.length, endIndex);
    console.log('✅ Extracted JSON from markdown block');
  } else {
    console.log('⚠️ Markdown markers found but extraction failed');
  }
} else {
  console.log('ℹ️ No markdown code block, using raw text');
}

// Clean up the JSON string
jsonString = jsonString
  .trim()
  .replace(/,(\s*[}\]])/g, '$1');  // Remove trailing commas

console.log('📏 JSON string length:', jsonString.length);

let parsedData;
try {
  parsedData = JSON.parse(jsonString);
  console.log('✅ JSON parsed successfully');
} catch (error) {
  console.error('❌ JSON parse error:', error.message);
  console.error('📍 Error at position:', error.message.match(/position (\d+)/)?.[1]);
  
  // Show context around error
  const errorPos = parseInt(error.message.match(/position (\d+)/)?.[1] || '0');
  const contextStart = Math.max(0, errorPos - 50);
  const contextEnd = Math.min(jsonString.length, errorPos + 50);
  console.error('📄 Context:', jsonString.substring(contextStart, contextEnd));
  
  return {
    json: {
      error: 'Failed to parse JSON',
      parseError: error.message,
      textLength: text.length,
      jsonLength: jsonString.length,
      context: jsonString.substring(contextStart, contextEnd),
      suggestion: 'Check AI response format. Ensure valid JSON is returned.'
    }
  };
}

// Flatten skills if they're nested (backward compatibility)
if (parsedData.technical_skills && !parsedData.skills_flat) {
  console.log('🔄 Flattening technical_skills...');
  
  const flattenSkills = (obj) => {
    const allSkills = [];
    const extract = (val) => {
      if (Array.isArray(val)) {
        allSkills.push(...val);
      } else if (typeof val === 'object' && val !== null) {
        Object.values(val).forEach(extract);
      }
    };
    extract(obj);
    return [...new Set(allSkills)]; // Remove duplicates
  };
  
  parsedData.skills_flat = flattenSkills(parsedData.technical_skills);
  delete parsedData.technical_skills; // Clean up
  
  console.log('✅ Flattened', parsedData.skills_flat.length, 'skills');
}

// Ensure required fields exist (with defaults)
parsedData = {
  name: parsedData.name || 'Unknown',
  role: parsedData.role || 'Not specified',
  location: parsedData.location || null,
  email: parsedData.email || null,
  phone: parsedData.phone || null,
  experience_years: parsedData.experience_years || 0,
  bio: parsedData.bio || null,
  skills_flat: parsedData.skills_flat || [],
  education: parsedData.education || [],
  work_experience: parsedData.work_experience || [],
  languages: parsedData.languages || [],
  certifications: parsedData.certifications || [],
  projects: parsedData.projects || [],
  ...parsedData // Keep any other fields
};

console.log('✅ CV data processed successfully');
console.log('📊 Skills extracted:', parsedData.skills_flat?.length || 0);
console.log('💼 Work experience entries:', parsedData.work_experience?.length || 0);
console.log('🎓 Education entries:', parsedData.education?.length || 0);

return {
  json: {
    response: parsedData
  }
};
