// n8n Code Node - Flatten AI Response (FIXED VERSION)
// This handles truncated JSON and malformed responses better

const aiResponse = $input.first().json;
const text = aiResponse.content.parts[0].text;

// Remove markdown code blocks
let jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
let jsonString = jsonMatch ? jsonMatch[1] : text;

// Clean up common JSON issues
jsonString = jsonString
  .trim()
  .replace(/,(\s*[}\]])/g, '$1')  // Remove trailing commas
  .replace(/'/g, '"')              // Replace single quotes with double quotes

// NEW: Check if JSON is truncated (ends mid-string)
const isTruncated = !jsonString.trim().endsWith('}') && !jsonString.trim().endsWith(']');

if (isTruncated) {
  console.log('⚠️ JSON appears truncated, attempting to fix...');
  
  // Try to close any open strings
  const openQuotes = (jsonString.match(/"/g) || []).length;
  if (openQuotes % 2 !== 0) {
    // Odd number of quotes = unclosed string
    jsonString += '"';
  }
  
  // Try to close any open objects/arrays
  const openBraces = (jsonString.match(/\{/g) || []).length;
  const closeBraces = (jsonString.match(/\}/g) || []).length;
  const openBrackets = (jsonString.match(/\[/g) || []).length;
  const closeBrackets = (jsonString.match(/\]/g) || []).length;
  
  // Add missing closing brackets
  for (let i = 0; i < (openBrackets - closeBrackets); i++) {
    jsonString += ']';
  }
  
  // Add missing closing braces
  for (let i = 0; i < (openBraces - closeBraces); i++) {
    jsonString += '}';
  }
  
  console.log('✅ Attempted to fix truncated JSON');
}

let parsedData;
try {
  parsedData = JSON.parse(jsonString);
  console.log('✅ JSON parsed successfully');
} catch (error) {
  console.error('❌ JSON parse error:', error.message);
  
  // Try to extract just the JSON object
  const objectMatch = jsonString.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    try {
      parsedData = JSON.parse(objectMatch[0]);
      console.log('✅ Extracted and parsed JSON object');
    } catch (innerError) {
      console.error('❌ Inner parse error:', innerError.message);
      
      // Last resort: Try to salvage what we can
      try {
        // Remove everything after the last complete field
        const lastComma = jsonString.lastIndexOf(',');
        const lastColon = jsonString.lastIndexOf(':');
        
        if (lastComma > lastColon) {
          // Truncated after a comma, remove incomplete field
          jsonString = jsonString.substring(0, lastComma);
        } else {
          // Truncated in the middle of a value, remove incomplete field
          const secondLastComma = jsonString.lastIndexOf(',', lastComma - 1);
          jsonString = jsonString.substring(0, secondLastComma);
        }
        
        // Close the JSON
        jsonString += '}';
        
        parsedData = JSON.parse(jsonString);
        console.log('✅ Salvaged partial JSON');
      } catch (salvageError) {
        // Give up, return error
        return {
          json: {
            error: 'Failed to parse JSON',
            originalText: text.substring(0, 1000),
            parseError: error.message,
            suggestion: 'AI response may be too long. Try shortening the prompt or increasing token limit.'
          }
        };
      }
    }
  } else {
    return {
      json: {
        error: 'No JSON found in response',
        originalText: text.substring(0, 1000)
      }
    };
  }
}

// Flatten skills if they're nested (backward compatibility)
if (parsedData.technical_skills && !parsedData.skills_flat) {
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

return {
  json: {
    response: parsedData
  }
};
