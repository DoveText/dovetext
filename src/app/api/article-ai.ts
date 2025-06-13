'use client';

import { ArticlePlanningData } from '../articles/create/components/ArticlePlanningForm';
import { AIGeneratedArticle } from '../articles/create/components/AIArticleSuggestions';
import { apiClient } from './client';

/**
 * API client for AI article generation
 */
export const articleAiApi = {
  /**
   * Generate article suggestions based on planning data
   * @param planningData The article planning data
   * @returns AI-generated article suggestions
   */
  generateArticle: async (planningData: ArticlePlanningData): Promise<AIGeneratedArticle> => {
    try {
      console.log('Making API call to /api/v1/gen/schema with data:', planningData);
      
      // Make API call to the schema generation endpoint using apiClient for authentication
      const { data } = await apiClient.post('/api/v1/gen/schema', planningData);
      
      console.log('API response received:', data);
      
      // Validate the API response
      if (!data || !data.title || !data.outline || !Array.isArray(data.outline)) {
        console.error('Invalid API response structure:', data);
        throw new Error('Received invalid data structure from API');
      }
      
      // Transform the API response to match our AIGeneratedArticle interface
      return {
        titles: [data.title, ...(data.alternativeTitles || []).slice(0, 3)],
        selectedTitle: data.title,
        outline: data.outline.map((item: any) => ({
          level: item.level,
          heading: item.heading,
          content: item.content || ''
        })),
        introduction: data.introduction,
        conclusion: data.conclusion,
        tags: data.tags || planningData.keywords || []
      };
    } catch (error: any) {
      console.error('Error generating article:', error);
      
      // Enhance error with more context
      if (error.response) {
        const enhancedError = new Error(
          `API error (${error.response.status}): ${error.response.data?.error || error.message}`
        );
        (enhancedError as any).originalError = error;
        (enhancedError as any).status = error.response.status;
        throw enhancedError;
      }
      
      throw error;
    }
  },
  
  /**
   * Regenerate article suggestions based on planning data
   * @param planningData The article planning data
   * @returns AI-generated article suggestions
   */
  regenerateArticle: async (planningData: ArticlePlanningData): Promise<AIGeneratedArticle> => {
    // Add a flag to indicate this is a regeneration request
    const regenerationData = {
      ...planningData,
      isRegeneration: true
    };
    return articleAiApi.generateArticle(regenerationData);
  }
};

// Helper functions to generate mock data

function getTitlePrefix(intent: string): string {
  const prefixes: Record<string, string[]> = {
    'educate': ['The Ultimate Guide to', 'Understanding', 'A Complete Introduction to'],
    'persuade': ['Why You Should Consider', 'The Benefits of', 'How to Leverage'],
    'entertain': ['Fascinating Facts About', 'The Surprising World of', 'Exploring'],
    'inform': ['Latest Updates on', 'What You Need to Know About', 'Breaking Down'],
    'analyze': ['An Analysis of', 'Examining', 'Deep Dive into'],
    'instruct': ['How to', 'Step-by-Step Guide to', 'Mastering']
  };
  
  const options = prefixes[intent] || prefixes['educate'];
  return options[Math.floor(Math.random() * options.length)];
}

function getAlternativeTitlePrefix(intent: string): string {
  const prefixes: Record<string, string[]> = {
    'educate': ['Essential Knowledge About', 'Everything You Need to Know About', 'Demystifying'],
    'persuade': ['The Case for', 'X Reasons to Embrace', 'Transforming Your Approach to'],
    'entertain': ['The Incredible Story of', 'Discovering the Magic of', 'The Hidden Secrets of'],
    'inform': ['The Current State of', 'A Fresh Perspective on', 'Insights into'],
    'analyze': ['Critical Analysis of', 'Unpacking', 'Evaluating'],
    'instruct': ['The Beginner\'s Guide to', 'Practical Tips for', 'Secrets to Successfully']
  };
  
  const options = prefixes[intent] || prefixes['educate'];
  return options[Math.floor(Math.random() * options.length)];
}

function getTitleSuffix(intent: string): string {
  const suffixes: Record<string, string[]> = {
    'educate': ['Explained Simply', 'for Beginners', 'The Essential Guide'],
    'persuade': ['That Will Transform Your Business', 'You Can\'t Ignore', 'for Success'],
    'entertain': ['That Will Amaze You', 'You Never Knew Existed', 'Behind the Scenes'],
    'inform': ['The Latest Trends', 'What\'s Changing in 2025', 'Industry Updates'],
    'analyze': ['A Critical Review', 'Strengths and Weaknesses', 'Opportunities and Challenges'],
    'instruct': ['in X Simple Steps', 'A Practical Approach', 'Tips and Tricks']
  };
  
  const options = suffixes[intent] || suffixes['educate'];
  return options[Math.floor(Math.random() * options.length)];
}

function getTopicFromPurpose(purpose: string): string {
  // Extract a topic from the purpose text
  // This is a simple implementation - in reality, you'd use NLP to extract key topics
  const words = purpose.split(' ');
  if (words.length <= 3) return purpose;
  
  // Take a substring of the purpose
  const startIndex = Math.floor(Math.random() * Math.floor(words.length / 2));
  const length = Math.min(3, words.length - startIndex);
  return words.slice(startIndex, startIndex + length).join(' ');
}

function generateOutline(planningData: ArticlePlanningData): AIGeneratedArticle['outline'] {
  // Generate a mock outline based on the planning data
  // In a real implementation, this would be generated by an AI
  
  const outline: AIGeneratedArticle['outline'] = [];
  
  // Add sections based on intent
  if (planningData.intent === 'educate') {
    outline.push({ heading: 'Understanding the Basics', level: 2 });
    outline.push({ heading: 'Key Concepts', level: 2 });
    outline.push({ heading: 'Practical Applications', level: 2 });
    outline.push({ heading: 'Common Misconceptions', level: 2 });
    outline.push({ heading: 'Advanced Topics', level: 2 });
  } else if (planningData.intent === 'persuade') {
    outline.push({ heading: 'The Current Challenge', level: 2 });
    outline.push({ heading: 'Why Change is Necessary', level: 2 });
    outline.push({ heading: 'Benefits of the New Approach', level: 2 });
    outline.push({ heading: 'Addressing Common Concerns', level: 2 });
    outline.push({ heading: 'Next Steps', level: 2 });
  } else if (planningData.intent === 'entertain') {
    outline.push({ heading: 'Setting the Scene', level: 2 });
    outline.push({ heading: 'Unexpected Discoveries', level: 2 });
    outline.push({ heading: 'Behind the Curtain', level: 2 });
    outline.push({ heading: 'Fascinating Details', level: 2 });
    outline.push({ heading: 'The Big Reveal', level: 2 });
  } else if (planningData.intent === 'inform') {
    outline.push({ heading: 'Recent Developments', level: 2 });
    outline.push({ heading: 'Key Changes', level: 2 });
    outline.push({ heading: 'Impact Analysis', level: 2 });
    outline.push({ heading: 'Expert Opinions', level: 2 });
    outline.push({ heading: 'Future Outlook', level: 2 });
  } else if (planningData.intent === 'analyze') {
    outline.push({ heading: 'Background and Context', level: 2 });
    outline.push({ heading: 'Methodology', level: 2 });
    outline.push({ heading: 'Findings', level: 2 });
    outline.push({ heading: 'Interpretation', level: 2 });
    outline.push({ heading: 'Implications', level: 2 });
  } else if (planningData.intent === 'instruct') {
    outline.push({ heading: 'Prerequisites', level: 2 });
    outline.push({ heading: 'Step 1: Getting Started', level: 2 });
    outline.push({ heading: 'Step 2: Core Process', level: 2 });
    outline.push({ heading: 'Step 3: Advanced Techniques', level: 2 });
    outline.push({ heading: 'Troubleshooting', level: 2 });
  }
  
  // Add some subsections
  if (outline.length > 2) {
    // Add subsections to the second main section
    const secondSectionIndex = 1;
    const mainHeading = outline[secondSectionIndex].heading;
    
    // Insert subsections after the main section
    outline.splice(secondSectionIndex + 1, 0, 
      { heading: `${mainHeading} - Part 1`, level: 3 },
      { heading: `${mainHeading} - Part 2`, level: 3 }
    );
  }
  
  // Add content hints to some sections
  outline.forEach((section, index) => {
    if (index % 2 === 0) {
      section.content = 'This section will cover key points related to ' + 
        (planningData.keywords.length > 0 ? planningData.keywords[index % planningData.keywords.length] : 'the topic') + 
        ' with examples and explanations.';
    }
  });
  
  return outline;
}

function generateIntroduction(planningData: ArticlePlanningData): string {
  // Generate a mock introduction based on the planning data
  // In a real implementation, this would be generated by an AI
  
  const audienceText = planningData.targetAudience === 'general' 
    ? 'readers' 
    : planningData.targetAudience;
  
  const keywordText = planningData.keywords.length > 0
    ? planningData.keywords.join(', ')
    : 'this topic';
  
  return `In this article, we'll explore ${getTopicFromPurpose(planningData.purpose)} and its significance for ${audienceText}. ` +
    `Understanding ${keywordText} is essential for anyone looking to stay informed and make better decisions in this area. ` +
    `We'll cover the key concepts, provide practical insights, and address common questions to give you a comprehensive understanding of the subject matter.`;
}

function generateConclusion(planningData: ArticlePlanningData): string {
  // Generate a mock conclusion based on the planning data
  // In a real implementation, this would be generated by an AI
  
  return `In conclusion, ${getTopicFromPurpose(planningData.purpose)} represents an important area that deserves attention and understanding. ` +
    `By focusing on the key aspects we've discussed, you can develop a deeper appreciation for the subject and apply these insights in practical ways. ` +
    `Remember that continuous learning and adaptation are essential in this ever-evolving field. ` +
    `We hope this article has provided valuable information that you can use moving forward.`;
}
