# n8n CV Processing Webhook

## Overview

This document describes the webhook format for CV processing integration with your n8n instance.

## Webhook Configuration

### Environment Variable

Add to your `.env` file:
```
VITE_N8N_CV_WEBHOOK_URL=https://your-n8n-instance.com/webhook/cv-process
```

## Request Format

The webhook receives CV data as a **Storage URL** (CVs are always uploaded to Supabase Storage first):

**Endpoint:**
```
POST https://your-n8n-instance.com/webhook/cv-process
```

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "user_id": "uuid-of-user",
  "cv_url": "https://your-project.supabase.co/storage/v1/object/public/cvs/user-123-1234567890.pdf",
  "email": "user@example.com",
  "filename": "john_doe_cv.pdf"
}
```

**Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `user_id` | string | UUID of the user |
| `cv_url` | string | Public URL to the CV file in Supabase Storage |
| `email` | string | User's email address |
| `filename` | string | Original filename of the uploaded CV |

## Expected Response Format

Your n8n workflow should return a JSON object with extracted CV data:

```json
{
  "skills": [
    "JavaScript",
    "React",
    "Node.js",
    "Python",
    "PostgreSQL"
  ],
  "experience_years": 5,
  "education": [
    {
      "degree": "Bachelor of Science",
      "field": "Computer Science",
      "institution": "University Name",
      "year": 2018
    }
  ],
  "work_experience": [
    {
      "title": "Senior Developer",
      "company": "Tech Corp",
      "duration": "2020-2023",
      "description": "Led development of web applications"
    }
  ],
  "desired_location": "San Francisco, CA",
  "desired_salary_min": 120000,
  "desired_remote": true,
  "languages": ["English", "Spanish"],
  "certifications": ["AWS Certified Developer"],
  "summary": "Experienced full-stack developer with 5 years..."
}
```

### Response Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `skills` | array | Yes | List of technical skills |
| `experience_years` | number | Yes | Years of professional experience |
| `education` | array | No | Educational background |
| `work_experience` | array | No | Work history |
| `desired_location` | string | No | Preferred job location |
| `desired_salary_min` | number | No | Minimum desired salary |
| `desired_remote` | boolean | No | Remote work preference |
| `languages` | array | No | Spoken languages |
| `certifications` | array | No | Professional certifications |
| `summary` | string | No | Professional summary |

## n8n Workflow Example

### Simple 3-Node Workflow

1. **Webhook Trigger**
   - Method: POST
   - Path: `/cv-process`
   - Response Mode: Last Node

2. **Gemini: Analyze Document** (or similar AI node)
   - Input Type: **URL**
   - Document URL: `{{ $json.cv_url }}`
   - Prompt: "Extract structured information from this CV: skills, experience years, education, work history, desired location, desired salary, remote preference, languages, certifications, and a professional summary. Return as JSON."
   - Output: JSON

3. **Respond to Webhook**
   - Return the parsed JSON data

**That's it!** Gemini can fetch the PDF directly from the URL. No base64 decoding needed!

3. **Extract Text from PDF**
   - Use PDF parser node or external OCR service
   - Extract text content

4. **AI Processing (OpenAI/Anthropic)**
   - Send extracted text to AI
   - Prompt: "Extract structured information from this CV..."
   - Parse JSON response

5. **Format Response**
   ```javascript
   return {
     skills: $json.skills || [],
     experience_years: $json.experience_years || 0,
     education: $json.education || [],
     work_experience: $json.work_experience || [],
     // ... other fields
   };
   ```

6. **Respond to Webhook**
   - Return formatted JSON

## Testing the Webhook

### Using curl

```bash
# Create a test base64 PDF
BASE64_PDF=$(base64 -i test_cv.pdf)

# Send request
curl -X POST https://your-n8n-instance.com/webhook/cv-process \
  -H "Content-Type: application/json" \
  -d "{
    \"filename\": \"test_cv.pdf\",
    \"pdf_base64\": \"$BASE64_PDF\",
    \"user_id\": \"test-user-123\"
  }"
```

### Expected Response

```json
{
  "skills": ["JavaScript", "React", "Node.js"],
  "experience_years": 3,
  "summary": "Software developer with 3 years experience..."
}
```

## Error Handling

### Error Response Format

```json
{
  "error": "Failed to process PDF",
  "details": "Invalid PDF format"
}
```

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| Invalid PDF | Corrupted or non-PDF file | Validate file type before upload |
| OCR Failed | Poor quality scan | Use higher quality PDF |
| AI API Error | Rate limit or API key issue | Check API credentials |
| Timeout | Large file processing | Implement async processing |

## Integration in JobMatch

### How It Works

1. User clicks "Upload CV" in Settings
2. Selects PDF file
3. Frontend converts to base64
4. Sends to n8n webhook
5. n8n processes and returns structured data
6. Frontend saves to `profiles.cv_data` in Supabase
7. AI matching uses CV data to rank jobs

### Database Storage

The response is stored in the `profiles` table:

```sql
UPDATE profiles
SET cv_data = '{
  "skills": ["JavaScript", "React"],
  "experience_years": 5,
  ...
}'
WHERE id = 'user-uuid';
```

## Improving Matching

Once CV data is stored, the matching algorithm can:

1. **Skill Matching**: Compare `cv_data.skills` with `jobs.required_skills`
2. **Experience Level**: Match `cv_data.experience_years` with `jobs.experience_level`
3. **Location**: Compare `cv_data.desired_location` with `jobs.location`
4. **Salary**: Compare `cv_data.desired_salary_min` with `jobs.salary_min`
5. **Remote**: Match `cv_data.desired_remote` with `jobs.is_remote`

## Security Considerations

1. **Validate File Size**: Limit to 5MB
2. **Validate File Type**: Only accept PDF
3. **Rate Limiting**: Prevent abuse
4. **Authentication**: Verify user is logged in
5. **Sanitize Input**: Clean extracted text

## Next Steps

1. Set up your n8n workflow
2. Configure the webhook URL in `.env`
3. Test with a sample CV
4. Verify data is saved to Supabase
5. Test job matching with CV data

## Support

If you need help setting up the n8n workflow, see the example workflow in `examples/n8n-cv-processing-workflow.json` (to be created).
