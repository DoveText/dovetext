/**
 * ArticleMeta utility for handling article metadata
 * Provides consistent handling of metadata across create and edit workflows
 */

export interface ArticleMetadata {
  title?: string;
  author?: string;
  category?: string;
  filename?: string;
  contentType?: string;
  createdAt?: string;
  lastModified?: string;
  suggested_titles?: string[];
  aiContext?: {
    purpose?: string;
    targetAudience?: string;
    intent?: string;
    desiredLength?: string;
    tone?: string;
    keywords?: string[];
    sections?: any[];
    generatedOutline?: any[];
    suggestedTags?: string[];
    alternativeTitles?: string[];
  };
  sections?: any[];
  [key: string]: any;
}

/**
 * ArticleMeta utility class for handling article metadata
 * Provides methods for extracting, normalizing, and merging metadata
 */
export class ArticleMeta {
  /**
   * Extract suggested titles from document metadata
   * @param metadata Document metadata object
   * @returns Array of suggested titles
   */
  static getSuggestedTitles(metadata: ArticleMetadata | null | undefined): string[] {
    if (!metadata) return [];
    
    console.log('ArticleMeta.getSuggestedTitles - Processing metadata:', metadata);
    
    // Check for suggested_titles at the root level
    if (metadata.suggested_titles && Array.isArray(metadata.suggested_titles) && metadata.suggested_titles.length > 0) {
      console.log('ArticleMeta - Found direct suggested_titles:', metadata.suggested_titles);
      return metadata.suggested_titles;
    }
    
    // Check for alternativeTitles in aiContext (legacy format)
    if (metadata.aiContext?.alternativeTitles && Array.isArray(metadata.aiContext.alternativeTitles) && metadata.aiContext.alternativeTitles.length > 0) {
      console.log('ArticleMeta - Found alternativeTitles in aiContext:', metadata.aiContext.alternativeTitles);
      // Convert to suggested_titles format
      return metadata.aiContext.alternativeTitles;
    }
    
    // Check for alternative titles in sections
    if (metadata.sections) {
      console.log('ArticleMeta - Checking sections for alternative titles');
      const altTitlesSection = metadata.sections.find(section => 
        section.title?.toLowerCase().includes('alternative titles') || 
        section.title?.toLowerCase().includes('suggested titles')
      );
      
      if (altTitlesSection?.content) {
        console.log('ArticleMeta - Found alternative titles section:', altTitlesSection);
        // Parse content that might be in format "- Title 1\n- Title 2\n- Title 3"
        const extractedTitles = altTitlesSection.content
          .split('\n')
          .map((line: string) => line.trim().replace(/^-\s*/, ''))
          .filter((title: string) => title.length > 0);
        
        console.log('ArticleMeta - Extracted titles from section:', extractedTitles);
        return extractedTitles;
      }
    }
    
    // Extract from Alternative Titles section if present
    if (metadata.aiContext?.sections) {
      const altTitlesSection = metadata.aiContext.sections.find(
        (section: any) => 
          section.title?.toLowerCase().includes('alternative titles') || 
          section.title?.toLowerCase().includes('suggested titles')
      );
      
      if (altTitlesSection?.content) {
        return altTitlesSection.content
          .split('\n')
          .map((line: string) => line.trim().replace(/^-\s*/, ''))
          .filter((title: string) => title.length > 0);
      }
    }
    
    return [];
  }
  
  /**
   * Normalize metadata for saving to ensure consistent structure
   * @param metadata Metadata to normalize
   * @returns Normalized metadata
   */
  static normalizeMetadata(metadata: ArticleMetadata): ArticleMetadata {
    console.log('ArticleMeta.normalizeMetadata - Input metadata:', metadata);
    
    // Create a deep copy to avoid modifying the original
    const normalizedMeta = JSON.parse(JSON.stringify(metadata));
    
    // Ensure suggested_titles is always at the root level
    if (!normalizedMeta.suggested_titles || !Array.isArray(normalizedMeta.suggested_titles)) {
      // Try to extract from other locations
      normalizedMeta.suggested_titles = this.getSuggestedTitles(normalizedMeta);
    }
    
    // If we have alternativeTitles in aiContext, move them to suggested_titles and remove
    if (normalizedMeta.aiContext?.alternativeTitles) {
      if (!normalizedMeta.suggested_titles) {
        normalizedMeta.suggested_titles = [];
      }
      
      // Add any unique titles from alternativeTitles to suggested_titles
      normalizedMeta.aiContext.alternativeTitles.forEach((title: string) => {
        if (!normalizedMeta.suggested_titles!.includes(title)) {
          normalizedMeta.suggested_titles!.push(title);
        }
      });
      
      // Remove alternativeTitles from aiContext
      delete normalizedMeta.aiContext.alternativeTitles;
    }
    
    console.log('ArticleMeta.normalizeMetadata - Normalized metadata:', normalizedMeta);
    return normalizedMeta;
  }
  
  /**
   * Merges original metadata with updated metadata
   * Preserves important fields from original metadata
   */
  static mergeMetadata(originalMeta: ArticleMetadata, updatedMeta: ArticleMetadata): ArticleMetadata {
    console.log('ArticleMeta.mergeMetadata - Original:', originalMeta, 'Updated:', updatedMeta);
    
    // Start with updated metadata
    const merged = { ...updatedMeta };
    
    // Preserve suggested titles from both sources
    const originalTitles = this.getSuggestedTitles(originalMeta);
    const updatedTitles = this.getSuggestedTitles(updatedMeta);
    
    console.log('ArticleMeta.mergeMetadata - Original titles:', originalTitles, 'Updated titles:', updatedTitles);
    
    // Combine titles, removing duplicates
    merged.suggested_titles = [...new Set([...originalTitles, ...updatedTitles])];
    
    console.log('ArticleMeta.mergeMetadata - Merged titles:', merged.suggested_titles);
    
    // Preserve AI context if present in original but not in updated
    if (originalMeta.aiContext && !updatedMeta.aiContext) {
      merged.aiContext = originalMeta.aiContext;
      
      // Remove alternativeTitles from aiContext if present
      if (merged.aiContext.alternativeTitles) {
        delete merged.aiContext.alternativeTitles;
      }
    }
    
    // Ensure we don't lose any important metadata fields
    if (originalMeta.createdAt && !updatedMeta.createdAt) {
      merged.createdAt = originalMeta.createdAt;
    }
    
    // Always update lastModified
    merged.lastModified = new Date().toISOString();
    
    console.log('ArticleMeta.mergeMetadata - Final merged metadata:', merged);
    return merged;
  }
}
