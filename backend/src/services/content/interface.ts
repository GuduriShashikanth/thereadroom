export interface ArticleGeneratedPayload {
  title: string;
  slug: string;
  metaDescription: string;
  shortAnswer: string; // Direct answer for SEO snippets
  content: string;     // Main body content (HTML or Markdown)
  headings: string[];  // H2/H3 for structure check
  faq: Array<{
    question: string;
    answer: string;
  }>;
}

export interface ContentGeneratorInterface {
  generateArticle(niche: string, keyword: string): Promise<ArticleGeneratedPayload>;
}
