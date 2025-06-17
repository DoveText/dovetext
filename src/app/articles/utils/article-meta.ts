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
    
    // Check for suggested_titles at the root level
    if (metadata.suggested_titles && Array.isArray(metadata.suggested_titles) && metadata.suggested_titles.length > 0) {
      return metadata.suggested_titles;
    }
    
    // Check for alternativeTitles in aiContext (legacy format)
    if (metadata.aiContext?.alternativeTitles && Array.isArray(metadata.aiContext.alternativeTitles) && metadata.aiContext.alternativeTitles.length > 0) {
      // Convert to suggested_titles format
      return metadata.aiContext.alternativeTitles;
    }
    
    // Check for alternative titles in sections
    if (metadata.sections) {
      const altTitlesSection = metadata.sections.find(section =>
        section.title?.toLowerCase().includes('alternative titles') || 
        section.title?.toLowerCase().includes('suggested titles')
      );
      
      if (altTitlesSection?.content) {
        // Parse content that might be in format "- Title 1\n- Title 2\n- Title 3"
        const extractedTitles = altTitlesSection.content
          .split('\n')
          .map((line: string) => line.trim().replace(/^-\s*/, ''))
          .filter((title: string) => title.length > 0);
        
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
   * Merges original metadata with updated metadata
   * Preserves important fields from original metadata
   */
  static mergeMetadata(originalMeta: ArticleMetadata, updatedMeta: ArticleMetadata): ArticleMetadata {
    // Start with updated metadata
    const merged = { ...updatedMeta };
    
    // Preserve suggested titles from both sources
    const originalTitles = this.getSuggestedTitles(originalMeta);
    const updatedTitles = this.getSuggestedTitles(updatedMeta);
    
    // Combine titles, removing duplicates
    merged.suggested_titles = [...new Set([...originalTitles, ...updatedTitles])];
    
    // Preserve AI context if present in original but not in updated
    if (originalMeta.aiContext && !updatedMeta.aiContext) {
      merged.aiContext = originalMeta.aiContext;
      
      // Remove alternativeTitles from aiContext if present
      if (merged.aiContext.alternativeTitles) {
        delete merged.aiContext.alternativeTitles;
      }
    }
    
    return merged;
  }
}
