/**
 * Clean HTML and convert to readable plain text
 * Handles HTML entities, tags, and formatting
 */

export function htmlToText(html: string | null | undefined): string {
  if (!html) return ''

  // Create a temporary div to parse HTML
  const temp = document.createElement('div')
  temp.innerHTML = html

  // Remove script and style elements
  const scripts = temp.querySelectorAll('script, style')
  scripts.forEach(el => el.remove())

  // Get text content (automatically decodes HTML entities)
  let text = temp.textContent || temp.innerText || ''

  // Clean up whitespace
  text = text
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Max 2 newlines
    .replace(/[ \t]+/g, ' ') // Normalize spaces
    .trim()

  return text
}

/**
 * Convert HTML to formatted text with basic structure
 * Preserves lists, paragraphs, and line breaks
 */
export function htmlToFormattedText(html: string | null | undefined): string {
  if (!html) return ''

  let text = html

  // Convert common HTML elements to text equivalents
  text = text
    // Lists
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<\/li>/gi, '')
    .replace(/<ul[^>]*>/gi, '\n')
    .replace(/<\/ul>/gi, '\n')
    .replace(/<ol[^>]*>/gi, '\n')
    .replace(/<\/ol>/gi, '\n')
    
    // Paragraphs and breaks
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    
    // Headers
    .replace(/<h[1-6][^>]*>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    
    // Strong/bold
    .replace(/<strong[^>]*>/gi, '')
    .replace(/<\/strong>/gi, '')
    .replace(/<b[^>]*>/gi, '')
    .replace(/<\/b>/gi, '')
    
    // Links - keep just the text
    .replace(/<a[^>]*>(.*?)<\/a>/gi, '$1')
    
    // Remove all other HTML tags
    .replace(/<[^>]+>/g, '')
    
    // Decode HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/â/g, "'") // Common encoding issue
    .replace(/â/g, '"')
    .replace(/â/g, '"')
    .replace(/â/g, '—')
    
    // Clean up whitespace
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Max 2 newlines
    .replace(/[ \t]+/g, ' ') // Normalize spaces
    .trim()

  return text
}

/**
 * Check if text contains HTML tags
 */
export function isHTML(text: string | null | undefined): boolean {
  if (!text) return false
  return /<[^>]+>/.test(text)
}
