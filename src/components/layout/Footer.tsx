import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../ui/Logo';

const socialLinks = [
  // { name: 'Facebook', href: '#', icon: Facebook },
  // { name: 'Instagram', href: '#', icon: Instagram },
  // { name: 'Twitter', href: '#', icon: Twitter },
];

const Footer: React.FC = () => {
  return (
    <footer className="bg-navbar-glass dark:bg-navbar-glass-dark backdrop-blur-md backdrop-saturate-150 bg-clip-padding border-t border-navbar-glass-border dark:border-navbar-glass-border-dark py-8 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:pt-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="mb-4">
              <Logo size="small" showText={true} />
            </div>
            <p className="text-muted-foreground">
              Exchange skills and services with others in your community.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <a href="/help" className="text-muted-foreground hover:text-foreground dark:hover:text-foreground transition-colors duration-200">Help Center</a>
              </li>
              <li>
                <a href="/guides" className="text-muted-foreground hover:text-foreground dark:hover:text-foreground transition-colors duration-200">Guides</a>
              </li>
              <li>
                <a href="/blog" className="text-muted-foreground hover:text-foreground dark:hover:text-foreground transition-colors duration-200">Blog</a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <a href="/about" className="text-muted-foreground hover:text-foreground dark:hover:text-foreground transition-colors duration-200">About</a>
              </li>
              <li>
                <a href="/careers" className="text-muted-foreground hover:text-foreground dark:hover:text-foreground transition-colors duration-200">Careers</a>
              </li>
              <li>
                <a href="/contact" className="text-muted-foreground hover:text-foreground dark:hover:text-foreground transition-colors duration-200">Contact</a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <a href="/privacy" className="text-muted-foreground hover:text-foreground dark:hover:text-foreground transition-colors duration-200">Privacy Policy</a>
              </li>
              <li>
                <a href="/terms" className="text-muted-foreground hover:text-foreground dark:hover:text-foreground transition-colors duration-200">Terms of Service</a>
              </li>
              <li>
                <a href="/cookies" className="text-muted-foreground hover:text-foreground dark:hover:text-foreground transition-colors duration-200">Cookie Policy</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border/50 dark:border-border/30 flex flex-col md:flex-row justify-between items-center">
          <p className="text-muted-foreground text-sm">
            &copy; {new Date().getFullYear()} TradeYa. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
