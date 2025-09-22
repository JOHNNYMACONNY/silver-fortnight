import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../ui/Logo';
import { cn } from '../../utils/cn';
import { useMobileOptimization } from '../../hooks/useMobileOptimization';

// Social media icons (using simple text for now, can be replaced with actual icons)
const SocialIcon = ({ name, href }: { name: string; href: string }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className={cn(
      'inline-flex items-center justify-center w-8 h-8 rounded-lg',
      'text-muted-foreground hover:text-foreground',
      'bg-muted/30 hover:bg-muted/50',
      'transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
      'touch-manipulation' // Optimize for touch
    )}
    aria-label={`Visit TradeYa on ${name}`}
  >
    <span className="text-xs font-medium">{name[0]}</span>
  </a>
);

const socialLinks = [
  { name: 'Twitter', href: 'https://twitter.com/tradeya' },
  { name: 'LinkedIn', href: 'https://linkedin.com/company/tradeya' },
  { name: 'Discord', href: 'https://discord.gg/tradeya' },
];

// Footer link component with proper accessibility
const FooterLink = ({ 
  href, 
  children, 
  external = false 
}: { 
  href: string; 
  children: React.ReactNode;
  external?: boolean;
}) => {
  const linkId = React.useId();
  
  return (
    <li>
      <a
        href={href}
        {...(external && { target: '_blank', rel: 'noopener noreferrer' })}
        className={cn(
          'text-muted-foreground hover:text-foreground',
          'transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          'rounded-sm px-1 py-0.5 -mx-1 -my-0.5', // Expand touch target
          'touch-manipulation'
        )}
        aria-describedby={external ? `${linkId}-description` : undefined}
      >
        {children}
        {external && (
          <span id={`${linkId}-description`} className="sr-only">
            Opens in new tab
          </span>
        )}
      </a>
    </li>
  );
};

const Footer: React.FC = () => {
  const {
    isMobile,
    isTablet,
  } = useMobileOptimization();

  return (
    <footer 
      className={cn(
        // Compact glassmorphism - subtle background only
        'bg-card/80 dark:bg-card/80 backdrop-blur-sm',
        'border-t border-border/50',
        'transition-all duration-300',
        // Ensure footer stays below all modals (z-modal = 30, z-[10000] for advanced filter, z-[10001] for filter content)
        'relative z-10',
        // Mobile optimizations
        isMobile && 'touch-manipulation'
      )}
      role="contentinfo"
      aria-label="Site footer"
    >
      
      <div className={cn(
        'max-w-7xl mx-auto',
        // Compact responsive padding - much smaller
        isMobile ? 'px-4 py-4' : isTablet ? 'px-6 py-5' : 'px-8 py-6'
      )}>
        {/* Main footer content */}
        <div className={cn(
          'grid',
          // Mobile-first responsive grid
          'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
          // Compact responsive gap
          isMobile ? 'gap-4' : isTablet ? 'gap-6' : 'gap-8'
        )}>
          {/* Brand section - Compact design */}
          <div className="sm:col-span-2 lg:col-span-1 space-y-3">
            <div>
              <Logo size="small" showText={true} />
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Exchange skills and services with others in your community. 
              Build connections, grow your network, and create meaningful collaborations.
            </p>
            
            {/* Social media links - Compact */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Follow us
              </span>
              <div className="flex items-center gap-2">
                {socialLinks.map((social) => (
                  <SocialIcon key={social.name} {...social} />
                ))}
              </div>
            </div>
          </div>

          {/* Resources section - Compact */}
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">
              Resources
            </h3>
            <ul className="space-y-2" role="list" aria-label="Resource links">
              <FooterLink href="/docs/profile-reputation">Help Center</FooterLink>
              <FooterLink href="/docs">Documentation</FooterLink>
              <FooterLink href="/challenges">Challenges</FooterLink>
              <FooterLink href="https://github.com/tradeya" external>
                GitHub
              </FooterLink>
            </ul>
          </div>

          {/* Company section - Compact */}
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">
              Company
            </h3>
            <ul className="space-y-2" role="list" aria-label="Company links">
              <FooterLink href="/about">About</FooterLink>
              <FooterLink href="/contact">Contact</FooterLink>
              <FooterLink href="/careers">Careers</FooterLink>
              <FooterLink href="/blog" external>Blog</FooterLink>
            </ul>
          </div>

          {/* Legal section - Compact */}
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">
              Legal
            </h3>
            <ul className="space-y-2" role="list" aria-label="Legal links">
              <FooterLink href="/privacy">Privacy Policy</FooterLink>
              <FooterLink href="/terms">Terms of Service</FooterLink>
              <FooterLink href="/cookies">Cookie Policy</FooterLink>
              <FooterLink href="/security">Security</FooterLink>
            </ul>
          </div>
        </div>

        {/* Footer bottom section - Compact */}
        <div className={cn(
          'mt-6 pt-4 border-t border-border/30',
          'flex flex-col sm:flex-row justify-between items-center gap-3'
        )}>
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} TradeYa. All rights reserved.
          </p>
          
          {/* Additional footer info */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>Made with ❤️ for the community</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">Version 1.0.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
