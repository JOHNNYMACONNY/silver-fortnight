/**
 * Sitemap Generator for TradeYa
 * Generates XML sitemaps for better SEO performance
 */

export interface SitemapEntry {
  url: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export class SitemapGenerator {
  private baseUrl: string;
  private entries: SitemapEntry[] = [];

  constructor(baseUrl: string = 'https://tradeya.app') {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  /**
   * Add a URL to the sitemap
   */
  addUrl(entry: SitemapEntry): void {
    // Ensure URL starts with base URL
    if (!entry.url.startsWith('http')) {
      entry.url = `${this.baseUrl}${entry.url.startsWith('/') ? '' : '/'}${entry.url}`;
    }
    
    this.entries.push(entry);
  }

  /**
   * Add multiple URLs at once
   */
  addUrls(entries: SitemapEntry[]): void {
    entries.forEach(entry => this.addUrl(entry));
  }

  /**
   * Generate the complete sitemap XML
   */
  generateXML(): string {
    const urlElements = this.entries.map(entry => {
      let urlXml = `    <url>\n        <loc>${this.escapeXml(entry.url)}</loc>`;
      
      if (entry.lastmod) {
        urlXml += `\n        <lastmod>${entry.lastmod}</lastmod>`;
      }
      
      if (entry.changefreq) {
        urlXml += `\n        <changefreq>${entry.changefreq}</changefreq>`;
      }
      
      if (entry.priority !== undefined) {
        urlXml += `\n        <priority>${entry.priority}</priority>`;
      }
      
      urlXml += '\n    </url>';
      return urlXml;
    }).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urlElements}
</urlset>`;
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  }

  /**
   * Generate default TradeYa sitemap
   */
  static generateTradeYaSitemap(): string {
    const generator = new SitemapGenerator('https://tradeya.app');
    const currentDate = new Date().toISOString().split('T')[0];

    // Static pages
    generator.addUrls([
      {
        url: '/',
        lastmod: currentDate,
        changefreq: 'daily',
        priority: 1.0
      },
      {
        url: '/about',
        lastmod: currentDate,
        changefreq: 'monthly',
        priority: 0.8
      },
      {
        url: '/features',
        lastmod: currentDate,
        changefreq: 'weekly',
        priority: 0.9
      },
      {
        url: '/pricing',
        lastmod: currentDate,
        changefreq: 'weekly',
        priority: 0.8
      },
      {
        url: '/contact',
        lastmod: currentDate,
        changefreq: 'monthly',
        priority: 0.7
      },
      {
        url: '/login',
        lastmod: currentDate,
        changefreq: 'yearly',
        priority: 0.6
      },
      {
        url: '/signup',
        lastmod: currentDate,
        changefreq: 'yearly',
        priority: 0.6
      },
      {
        url: '/dashboard',
        lastmod: currentDate,
        changefreq: 'daily',
        priority: 0.8
      },
      {
        url: '/projects',
        lastmod: currentDate,
        changefreq: 'daily',
        priority: 0.8
      },
      {
        url: '/collaboration',
        lastmod: currentDate,
        changefreq: 'weekly',
        priority: 0.7
      },
      {
        url: '/challenges',
        lastmod: currentDate,
        changefreq: 'daily',
        priority: 0.7
      }
    ]);

    return generator.generateXML();
  }

  /**
   * Generate robots.txt sitemap reference
   */
  static generateRobotsSitemapEntry(baseUrl: string = 'https://tradeya.app'): string {
    return `Sitemap: ${baseUrl}/sitemap.xml`;
  }
}

// Export for use in build scripts
export default SitemapGenerator;
