const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://thereadroom.onrender.com/api';

// Cache revalidation time (ISR) - Disable for dev
export const REVALIDATE_TIME = 0;

export interface Article {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  metaDescription: string;
  publishedAt: string;
  headings: string[];
  faq: { question: string; answer: string }[];
  niche: {
    name: string;
    slug: string;
  };
}

export interface Niche {
  id: string;
  name: string;
  slug: string;
  description: string;
  articles?: Partial<Article>[];
}

export const api = {
  /**
   * Fetch all niches
   */
  async getNiches(): Promise<Niche[]> {
    try {
      const res = await fetch(`${API_URL}/niches`, {
        next: { revalidate: REVALIDATE_TIME },
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.niches || [];
    } catch (error) {
      console.error('Failed to fetch niches:', error);
      return [];
    }
  },

  /**
   * Fetch a single niche by slug
   */
  async getNiche(slug: string): Promise<Niche | null> {
    try {
      const res = await fetch(`${API_URL}/niches/${slug}`, {
        next: { revalidate: REVALIDATE_TIME },
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.niche;
    } catch (error) {
      return null;
    }
  },

  /**
   * Fetch article by niche and slug
   */
  async getArticle(nicheSlug: string, articleSlug: string): Promise<Article | null> {
    try {
      const res = await fetch(`${API_URL}/articles/${nicheSlug}/${articleSlug}`, {
        next: { revalidate: REVALIDATE_TIME },
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.article;
    } catch (error) {
      console.error(`Failed to fetch article ${nicheSlug}/${articleSlug}:`, error);
      return null;
    }
  },

  /**
   * Fetch all published articles for sitemap
   */
  async getAllArticles(): Promise<Article[]> {
    try {
      // Assuming list endpoint supports getting all or we iterate niches
      // For now, let's fetch default list
      const res = await fetch(`${API_URL}/articles?status=PUBLISHED`, {
        next: { revalidate: REVALIDATE_TIME },
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.articles || [];
    } catch (error) {
      return [];
    }
  },
  /**
   * Admin: Trigger Content Generation
   */
  async triggerGeneration(niche: string, keyword: string, secret: string) {
    const res = await fetch(`${API_URL}/admin/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-secret': secret,
      },
      body: JSON.stringify({ niche, keyword }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Generation failed');
    }
    return res.json();
  },

  /**
   * Admin: Manual Article Creation
   */
  async createArticle(data: Partial<Article> & { niche: string, secret: string }) {
    const { secret, ...payload } = data;
    
    const res = await fetch(`${API_URL}/admin/articles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-secret': secret,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Creation failed');
    }
    return res.json();
  },

  /**
   * Admin: Upload Image
   */
  async uploadImage(file: File, secret: string) {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_URL}/admin/upload/image`, {
      method: 'POST',
      headers: {
        'x-admin-secret': secret,
      },
      body: formData,
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Upload failed');
    }
    return res.json();
  },

  /**
   * Admin: Import Markdown Article
   */
  async importMarkdown(file: File, secret: string) {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_URL}/admin/upload/markdown`, {
      method: 'POST',
      headers: {
        'x-admin-secret': secret,
      },
      body: formData,
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Import failed');
    }
    return res.json();
  },

  // ============================================
  // KEYWORD MANAGEMENT APIs
  // ============================================

  /**
   * Admin: Get all niches (for dropdown)
   */
  async getAdminNiches(secret: string) {
    const res = await fetch(`${API_URL}/admin/niches`, {
      headers: { 'x-admin-secret': secret },
    });
    if (!res.ok) throw new Error('Failed to fetch niches');
    return res.json();
  },

  /**
   * Admin: Get keywords with optional filters
   */
  async getKeywords(secret: string, nicheId?: string, status?: string) {
    let url = `${API_URL}/admin/keywords`;
    const params = new URLSearchParams();
    if (nicheId) params.append('nicheId', nicheId);
    if (status) params.append('status', status);
    if (params.toString()) url += `?${params.toString()}`;

    const res = await fetch(url, {
      headers: { 'x-admin-secret': secret },
    });
    if (!res.ok) throw new Error('Failed to fetch keywords');
    return res.json();
  },

  /**
   * Admin: Create a single keyword
   */
  async createKeyword(secret: string, data: { nicheId: string; keyword: string; intent?: string }) {
    const res = await fetch(`${API_URL}/admin/keywords`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-secret': secret,
      },
      body: JSON.stringify({ ...data, source: 'MANUAL' }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to create keyword');
    }
    return res.json();
  },

  /**
   * Admin: Bulk create keywords
   */
  async bulkCreateKeywords(secret: string, nicheId: string, keywords: string[]) {
    const res = await fetch(`${API_URL}/admin/keywords/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-secret': secret,
      },
      body: JSON.stringify({
        nicheId,
        keywords: keywords.map(k => ({ keyword: k })),
        source: 'MANUAL',
      }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Bulk creation failed');
    }
    return res.json();
  },

  /**
   * Admin: Update keyword status
   */
  async updateKeyword(secret: string, id: string, status: string) {
    const res = await fetch(`${API_URL}/admin/keywords/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-secret': secret,
      },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to update keyword');
    }
    return res.json();
  },

  /**
   * Admin: Delete keyword
   */
  async deleteKeyword(secret: string, id: string) {
    const res = await fetch(`${API_URL}/admin/keywords/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-secret': secret },
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to delete keyword');
    }
    return res.json();
  },

  /**
   * Admin: Create a new niche
   */
  async createNiche(secret: string, data: { name: string; slug: string; description?: string }) {
    const res = await fetch(`${API_URL}/admin/niches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-secret': secret,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to create niche');
    }
    return res.json();
  },
};
