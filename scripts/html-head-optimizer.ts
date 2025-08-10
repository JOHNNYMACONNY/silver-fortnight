/**
 * HTML Head Optimization Helper
 * Generates optimized meta tags and favicon links for better performance
 */

export interface FaviconConfig {
  sizes: number[];
  basePath: string;
  appleTouchIcon?: boolean;
  webManifest?: boolean;
}

export class HTMLHeadOptimizer {
  /**
   * Generate optimized favicon links
   */
  static generateFaviconLinks(config: FaviconConfig): string[] {
    const links: string[] = [];
    
    // Standard favicon
    links.push('<link rel="icon" type="image/x-icon" href="/favicon.ico">');
    
    // PNG favicons for different sizes
    config.sizes.forEach(size => {
      links.push(
        `<link rel="icon" type="image/png" sizes="${size}x${size}" href="${config.basePath}/favicon-${size}x${size}.png">`
      );
    });
    
    // Apple Touch Icons
    if (config.appleTouchIcon) {
      const appleSizes = [120, 152, 167, 180];
      appleSizes.forEach(size => {
        if (config.sizes.includes(size)) {
          links.push(
            `<link rel="apple-touch-icon" sizes="${size}x${size}" href="${config.basePath}/favicon-${size}x${size}.png">`
          );
        }
      });
    }
    
    // Web App Manifest
    if (config.webManifest) {
      links.push('<link rel="manifest" href="/manifest.json">');
    }
    
    return links;
  }

  /**
   * Generate optimized meta tags for performance and SEO
   */
  static generatePerformanceMetaTags(): string[] {
    return [
      // DNS prefetch for external resources
      '<link rel="dns-prefetch" href="//fonts.googleapis.com">',
      '<link rel="dns-prefetch" href="//fonts.gstatic.com">',
      '<link rel="dns-prefetch" href="//cdn.jsdelivr.net">',
      
      // Preconnect for critical resources
      '<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>',
      '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
      
      // Resource hints
      '<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">',
      '<meta name="format-detection" content="telephone=no">',
      
      // Security headers
      '<meta http-equiv="X-Content-Type-Options" content="nosniff">',
      '<meta http-equiv="X-Frame-Options" content="DENY">',
      '<meta http-equiv="X-XSS-Protection" content="1; mode=block">',
      
      // Modern web app capabilities
      '<meta name="theme-color" content="#3b82f6">',
      '<meta name="apple-mobile-web-app-capable" content="yes">',
      '<meta name="apple-mobile-web-app-status-bar-style" content="default">',
      '<meta name="apple-mobile-web-app-title" content="TradeYa">'
    ];
  }

  /**
   * Generate complete optimized head section
   */
  static generateOptimizedHead(config: {
    title: string;
    description: string;
    faviconConfig: FaviconConfig;
  }): string {
    const faviconLinks = this.generateFaviconLinks(config.faviconConfig);
    const performanceMeta = this.generatePerformanceMetaTags();
    
    const headContent = [
      `<title>${config.title}</title>`,
      `<meta name="description" content="${config.description}">`,
      ...performanceMeta,
      ...faviconLinks
    ];
    
    return headContent.join('\n  ');
  }
}

// Default configuration for TradeYa
export const DEFAULT_FAVICON_CONFIG: FaviconConfig = {
  sizes: [16, 32, 48, 96, 144, 192, 256, 512],
  basePath: '/icons',
  appleTouchIcon: true,
  webManifest: true
};

// Example usage:
// const headContent = HTMLHeadOptimizer.generateOptimizedHead({
//   title: 'TradeYa - Creative Collaboration Platform',
//   description: 'Professional platform for creative collaboration and project management',
//   faviconConfig: DEFAULT_FAVICON_CONFIG
// });
