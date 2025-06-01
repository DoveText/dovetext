import { apiClient } from '@/app/api/client';

export interface Blog {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author: string;
  coverImage?: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlogCreateRequest {
  title: string;
  slug?: string;
  content: string;
  excerpt?: string;
  author: string;
  coverImage?: string;
  tags?: string[];
  status?: 'draft' | 'published' | 'archived';
  publishedAt?: string;
}

export interface BlogUpdateRequest {
  id: number;
  title?: string;
  slug?: string;
  content?: string;
  excerpt?: string;
  author?: string;
  coverImage?: string;
  tags?: string[];
  status?: 'draft' | 'published' | 'archived';
  publishedAt?: string;
}

// Mock data for blogs
const mockBlogs: Blog[] = [
  {
    id: 1,
    title: 'Getting Started with Dove Text',
    slug: 'getting-started-with-dove-text',
    content: '# Getting Started with Dove Text\n\nWelcome to Dove Text, the modern text editor for the web. In this article, we\'ll explore the basic features and how to get started.\n\n## Installation\n\nTo install Dove Text, simply run:\n\n```bash\nnpm install dove-text\n```\n\n## Basic Usage\n\nHere\'s a simple example of how to use Dove Text in your project:\n\n```javascript\nimport { DoveText } from \'dove-text\';\n\nfunction MyEditor() {\n  return <DoveText defaultValue="Hello, world!" />;\n}\n```',
    excerpt: 'Learn how to get started with Dove Text, the modern text editor for the web.',
    author: 'John Doe',
    coverImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97',
    tags: ['tutorial', 'getting-started', 'documentation'],
    status: 'published',
    publishedAt: '2023-05-15T10:00:00Z',
    createdAt: '2023-05-10T14:30:00Z',
    updatedAt: '2023-05-15T09:45:00Z'
  },
  {
    id: 2,
    title: 'Advanced Markdown Features',
    slug: 'advanced-markdown-features',
    content: '# Advanced Markdown Features\n\nDove Text supports a variety of advanced markdown features that can help you create rich content. Let\'s explore some of these features.\n\n## Tables\n\n| Feature | Description |\n|---------|-------------|\n| Tables | Create structured data |\n| Code Blocks | Syntax highlighting |\n| Math | LaTeX support |\n\n## Math Equations\n\nYou can write math equations using LaTeX syntax:\n\n$$E = mc^2$$\n\n## Mermaid Diagrams\n\n```mermaid\ngraph TD;\n    A-->B;\n    A-->C;\n    B-->D;\n    C-->D;\n```',
    excerpt: 'Explore the advanced markdown features available in Dove Text.',
    author: 'Jane Smith',
    coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c',
    tags: ['markdown', 'advanced', 'tutorial'],
    status: 'published',
    publishedAt: '2023-06-01T08:30:00Z',
    createdAt: '2023-05-25T11:20:00Z',
    updatedAt: '2023-06-01T08:15:00Z'
  },
  {
    id: 3,
    title: 'Upcoming Features in Dove Text v2.0',
    slug: 'upcoming-features-dove-text-v2',
    content: '# Upcoming Features in Dove Text v2.0\n\nWe\'re excited to announce the upcoming features in Dove Text version 2.0. Here\'s a sneak peek at what\'s coming.\n\n## Real-time Collaboration\n\nCollaborate with your team in real-time, similar to Google Docs.\n\n## AI-Powered Writing Assistant\n\nGet suggestions and improvements for your writing with our new AI assistant.\n\n## Enhanced Mobile Support\n\nBetter touch controls and responsive design for mobile devices.\n\n## Timeline for Release\n\nWe\'re planning to release v2.0 in Q3 2023. Stay tuned for more updates!',
    excerpt: 'Get a sneak peek at the exciting new features coming in Dove Text version 2.0.',
    author: 'Alex Johnson',
    tags: ['roadmap', 'features', 'announcement'],
    status: 'draft',
    createdAt: '2023-06-10T15:45:00Z',
    updatedAt: '2023-06-12T09:30:00Z'
  }
];

// Helper function to generate a slug from a title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// Mock API implementation
export const blogsApi = {
  /**
   * Get all blogs
   */
  async getAllBlogs(): Promise<Blog[]> {
    // In a real implementation, this would call the API
    // const { data } = await apiClient.get<Blog[]>('/api/v1/blogs');
    // return data;
    
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...mockBlogs]);
      }, 500);
    });
  },

  /**
   * Get blogs by status
   */
  async getBlogsByStatus(status: string): Promise<Blog[]> {
    // In a real implementation, this would call the API
    // const { data } = await apiClient.get<Blog[]>(`/api/v1/blogs?status=${status}`);
    // return data;
    
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        const filteredBlogs = mockBlogs.filter(blog => blog.status === status);
        resolve([...filteredBlogs]);
      }, 500);
    });
  },

  /**
   * Get a blog by ID
   */
  async getBlogById(id: number): Promise<Blog> {
    // In a real implementation, this would call the API
    // const { data } = await apiClient.get<Blog>(`/api/v1/blogs/${id}`);
    // return data;
    
    // Mock implementation
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const blog = mockBlogs.find(b => b.id === id);
        if (blog) {
          resolve({...blog});
        } else {
          reject(new Error('Blog not found'));
        }
      }, 500);
    });
  },

  /**
   * Get a blog by slug
   */
  async getBlogBySlug(slug: string): Promise<Blog> {
    // In a real implementation, this would call the API
    // const { data } = await apiClient.get<Blog>(`/api/v1/blogs/slug/${slug}`);
    // return data;
    
    // Mock implementation
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const blog = mockBlogs.find(b => b.slug === slug);
        if (blog) {
          resolve({...blog});
        } else {
          reject(new Error('Blog not found'));
        }
      }, 500);
    });
  },

  /**
   * Create a new blog
   */
  async createBlog(request: BlogCreateRequest): Promise<Blog> {
    // In a real implementation, this would call the API
    // const { data } = await apiClient.post<Blog>('/api/v1/blogs', request);
    // return data;
    
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        const now = new Date().toISOString();
        const newBlog: Blog = {
          id: Math.max(...mockBlogs.map(b => b.id), 0) + 1,
          title: request.title,
          slug: request.slug || generateSlug(request.title),
          content: request.content,
          excerpt: request.excerpt || request.content.substring(0, 150) + '...',
          author: request.author,
          coverImage: request.coverImage,
          tags: request.tags || [],
          status: request.status || 'draft',
          publishedAt: request.status === 'published' ? (request.publishedAt || now) : undefined,
          createdAt: now,
          updatedAt: now
        };
        
        mockBlogs.push(newBlog);
        resolve({...newBlog});
      }, 500);
    });
  },

  /**
   * Update an existing blog
   */
  async updateBlog(request: BlogUpdateRequest): Promise<Blog> {
    // In a real implementation, this would call the API
    // const { data } = await apiClient.put<Blog>(`/api/v1/blogs/${request.id}`, request);
    // return data;
    
    // Mock implementation
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = mockBlogs.findIndex(b => b.id === request.id);
        if (index !== -1) {
          const now = new Date().toISOString();
          const updatedBlog = {
            ...mockBlogs[index],
            ...request,
            slug: request.slug || (request.title ? generateSlug(request.title) : mockBlogs[index].slug),
            updatedAt: now,
            publishedAt: request.status === 'published' && !mockBlogs[index].publishedAt ? now : mockBlogs[index].publishedAt
          };
          
          mockBlogs[index] = updatedBlog;
          resolve({...updatedBlog});
        } else {
          reject(new Error('Blog not found'));
        }
      }, 500);
    });
  },

  /**
   * Delete a blog
   */
  async deleteBlog(id: number): Promise<void> {
    // In a real implementation, this would call the API
    // await apiClient.delete(`/api/v1/blogs/${id}`);
    
    // Mock implementation
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = mockBlogs.findIndex(b => b.id === id);
        if (index !== -1) {
          mockBlogs.splice(index, 1);
          resolve();
        } else {
          reject(new Error('Blog not found'));
        }
      }, 500);
    });
  },

  /**
   * Publish a blog
   */
  async publishBlog(id: number): Promise<Blog> {
    // In a real implementation, this would call the API
    // const { data } = await apiClient.post<Blog>(`/api/v1/blogs/${id}/publish`);
    // return data;
    
    // Mock implementation
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = mockBlogs.findIndex(b => b.id === id);
        if (index !== -1) {
          const now = new Date().toISOString();
          const updatedBlog = {
            ...mockBlogs[index],
            status: 'published' as const,
            publishedAt: mockBlogs[index].publishedAt || now,
            updatedAt: now
          };
          
          mockBlogs[index] = updatedBlog;
          resolve({...updatedBlog});
        } else {
          reject(new Error('Blog not found'));
        }
      }, 500);
    });
  },

  /**
   * Archive a blog
   */
  async archiveBlog(id: number): Promise<Blog> {
    // In a real implementation, this would call the API
    // const { data } = await apiClient.post<Blog>(`/api/v1/blogs/${id}/archive`);
    // return data;
    
    // Mock implementation
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = mockBlogs.findIndex(b => b.id === id);
        if (index !== -1) {
          const updatedBlog = {
            ...mockBlogs[index],
            status: 'archived' as const,
            updatedAt: new Date().toISOString()
          };
          
          mockBlogs[index] = updatedBlog;
          resolve({...updatedBlog});
        } else {
          reject(new Error('Blog not found'));
        }
      }, 500);
    });
  }
};
