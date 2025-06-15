import { apiClient } from './client';

/**
 * Interface for tag node in hierarchical structure
 */
export interface TagNode {
  name: string;
  children?: TagNode[];
}

/**
 * Tags API client
 */
export const tagsApi = {
  /**
   * Get all tags for a specific content type
   * @param type The content type ('assets' or 'documents')
   * @param hierarchical If true, return tags in a hierarchical structure
   * @returns Set of tags or hierarchical tag structure
   */
  getTagsByType: async (type: string, hierarchical: boolean = false): Promise<string[] | TagNode> => {
    const { data } = await apiClient.get(`/api/v1/tags/${encodeURIComponent(type)}`, {
      params: { hierarchical }
    });
    return data || (hierarchical ? { name: 'root', children: [] } : []);
  },

  /**
   * Get all tags for all content types
   * @param hierarchical If true, return tags in a hierarchical structure
   * @returns Map of content type to tags
   */
  getAllTags: async (hierarchical: boolean = false): Promise<Record<string, string[] | TagNode>> => {
    const { data } = await apiClient.get('/api/v1/tags', {
      params: { hierarchical }
    });
    return data || {};
  },

  /**
   * Find content by tags
   * @param type The content type ('assets' or 'documents')
   * @param tags The tags to search for (array of tags)
   * @param matchAll If true, content must have all tags; if false, content can have any of the tags
   * @returns Set of content UUIDs that match the tag criteria
   */
  findContentByTags: async (
    type: string,
    tags: string[],
    matchAll: boolean = true
  ): Promise<string[]> => {
    const tagsParam = tags.join(',');
    const { data } = await apiClient.get(`/api/v1/tags/${encodeURIComponent(type)}/find`, {
      params: {
        tags: tagsParam,
        matchAll
      }
    });
    return data || [];
  }
};
