/**
 * Utility functions for parsing and analyzing article content
 */

/**
 * Represents a section of an article with heading, level, and content
 */
export interface ArticleSection {
  heading: string;
  level: number;
  content: string;
}

/**
 * Extract sections and headings from markdown content
 * 
 * @param content The markdown content to parse
 * @returns Array of sections with headings, levels, and content
 */
export function extractSections(content: string): ArticleSection[] {
  const sections: ArticleSection[] = [];
  
  // Handle empty content
  if (!content || content.trim() === '') {
    return sections;
  }
  
  // Split content into lines
  const lines = content.split('\n');
  
  let currentSection: ArticleSection | null = null;
  let currentContent: string[] = [];
  
  // Process each line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if line is a heading (starts with # symbols)
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    
    if (headingMatch) {
      // If we were tracking a section, save it before starting a new one
      if (currentSection) {
        currentSection.content = currentContent.join('\n').trim();
        sections.push(currentSection);
        currentContent = [];
      }
      
      // Start a new section
      currentSection = {
        heading: headingMatch[2].trim(),
        level: headingMatch[1].length,
        content: ''
      };
    } else if (currentSection) {
      // Add line to current section content
      currentContent.push(line);
    } else {
      // Content before any heading, create an implicit introduction section
      if (line.trim() !== '') {
        currentContent.push(line);
        if (!currentSection) {
          currentSection = {
            heading: 'Introduction',
            level: 0,  // Level 0 indicates implicit section
            content: ''
          };
        }
      }
    }
  }
  
  // Don't forget to add the last section
  if (currentSection) {
    currentSection.content = currentContent.join('\n').trim();
    sections.push(currentSection);
  }
  
  return sections;
}

/**
 * Get the surrounding context for a specific position in the content
 * 
 * @param content The full article content
 * @param position The position (character index) to get context for
 * @param contextSize The number of paragraphs before and after to include
 * @returns The surrounding paragraphs
 */
export function getSurroundingParagraphs(
  content: string, 
  position: number, 
  contextSize: number = 1
): string {
  if (!content || position >= content.length) {
    return '';
  }
  
  // Split content into paragraphs (double newlines)
  const paragraphs = content.split(/\n\s*\n/);
  
  // Find which paragraph contains the position
  let charCount = 0;
  let currentParagraphIndex = -1;
  
  for (let i = 0; i < paragraphs.length; i++) {
    const paragraphLength = paragraphs[i].length + 2; // +2 for the newlines
    if (position >= charCount && position < charCount + paragraphLength) {
      currentParagraphIndex = i;
      break;
    }
    charCount += paragraphLength;
  }
  
  if (currentParagraphIndex === -1) {
    return '';
  }
  
  // Get surrounding paragraphs
  const startIndex = Math.max(0, currentParagraphIndex - contextSize);
  const endIndex = Math.min(paragraphs.length - 1, currentParagraphIndex + contextSize);
  
  return paragraphs.slice(startIndex, endIndex + 1).join('\n\n');
}

/**
 * Extract the current section heading for a specific position in the content
 * 
 * @param content The full article content
 * @param position The position (character index) to get the heading for
 * @returns The current section heading or null if not found
 */
export function getCurrentSectionHeading(
  content: string, 
  position: number
): {heading: string, level: number} | null {
  const sections = extractSections(content);
  
  if (sections.length === 0) {
    return null;
  }
  
  // Calculate character positions for each section
  let charCount = 0;
  let currentSection = sections[0]; // Default to first section
  
  for (const section of sections) {
    // Calculate section length including heading and content
    const headingLine = '#'.repeat(section.level) + ' ' + section.heading;
    const sectionLength = headingLine.length + 1 + section.content.length; // +1 for newline
    
    if (position >= charCount && position < charCount + sectionLength) {
      return {
        heading: section.heading,
        level: section.level
      };
    }
    
    charCount += sectionLength + 2; // +2 for paragraph separation
  }
  
  // If position is beyond all sections, return the last section
  return {
    heading: sections[sections.length - 1].heading,
    level: sections[sections.length - 1].level
  };
}

/**
 * Generate AI context data from article content and metadata
 * 
 * @param content The article content
 * @param metadata The article metadata
 * @param cursorPosition Optional cursor position for targeted context
 * @returns Context object for AI content generation
 */
export function generateAIContext(
  content: string,
  metadata: any,
  cursorPosition?: number
) {
  // Extract sections for structure context
  const sections = extractSections(content);
  
  // Basic context that's always included
  const context = {
    title: metadata?.title || '',
    category: metadata?.category || '',
    sections: sections,
    
    // Include AI planning data if available
    purpose: metadata?.aiContext?.purpose || '',
    targetAudience: metadata?.aiContext?.targetAudience || '',
    intent: metadata?.aiContext?.intent || '',
    tone: metadata?.aiContext?.tone || 'professional',
    keywords: metadata?.aiContext?.keywords || [],
  };
  
  // Add position-specific context if cursor position is provided
  if (cursorPosition !== undefined) {
    const currentSection = getCurrentSectionHeading(content, cursorPosition);
    const surroundingText = getSurroundingParagraphs(content, cursorPosition, 2);
    
    return {
      ...context,
      currentPosition: {
        section: currentSection,
        surroundingText: surroundingText
      }
    };
  }
  
  return context;
}
