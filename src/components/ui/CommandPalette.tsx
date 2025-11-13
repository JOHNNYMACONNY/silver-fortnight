import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { Search, Command, ArrowRight, Hash, User, FileText, Zap, Users } from 'lucide-react';

interface CommandItem {
  id: string;
  title: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  category: 'navigation' | 'actions' | 'users' | 'search';
  keywords: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Define available commands
  const commands: CommandItem[] = useMemo(() => [
    // Navigation commands
    {
      id: 'nav-home',
      title: 'Go to Home',
      description: 'Navigate to the homepage',
      icon: FileText,
      action: () => navigate('/'),
      category: 'navigation',
      keywords: ['home', 'dashboard', 'main']
    },
    {
      id: 'nav-trades',
      title: 'Go to Trades',
      description: 'Browse and manage trades',
      icon: ArrowRight,
      action: () => navigate('/trades'),
      category: 'navigation',
      keywords: ['trades', 'trading', 'browse', 'exchange']
    },
    {
      id: 'nav-collaborations',
      title: 'Go to Collaborations',
      description: 'Find teams and join projects',
      icon: Users,
      action: () => navigate('/collaborations'),
      category: 'navigation',
      keywords: ['collaborations', 'teams', 'projects', 'partnerships', 'teamwork']
    },
    {
      id: 'nav-directory',
      title: 'Go to Directory',
      description: 'Browse people and profiles',
      icon: Users,
      action: () => navigate('/directory'),
      category: 'navigation',
      keywords: ['directory', 'people', 'members', 'profiles']
    },
    {
      id: 'nav-challenges',
      title: 'Go to Challenges',
      description: 'View available challenges',
      icon: Zap,
      action: () => navigate('/challenges'),
      category: 'navigation',
      keywords: ['challenges', 'tasks', 'compete', 'skills']
    },
    {
      id: 'nav-portfolio',
      title: 'Go to Portfolio',
      description: 'View your portfolio',
      icon: User,
      action: () => navigate('/portfolio'),
      category: 'navigation',
      keywords: ['portfolio', 'profile', 'work', 'showcase']
    },
    {
      id: 'nav-profile',
      title: 'Go to Profile',
      description: 'Edit your profile',
      icon: User,
      action: () => navigate('/profile'),
      category: 'navigation',
      keywords: ['profile', 'account', 'settings']
    },
    // Action commands
    {
      id: 'action-new-trade',
      title: 'Create New Trade',
      description: 'Start a new trade proposal',
      icon: ArrowRight,
      action: () => navigate('/trades/new'),
      category: 'actions',
      keywords: ['create', 'new', 'trade', 'proposal', 'offer']
    },
    {
      id: 'action-new-collaboration',
      title: 'Start New Collaboration',
      description: 'Create a team project',
      icon: Users,
      action: () => navigate('/collaborations/new'),
      category: 'actions',
      keywords: ['create', 'new', 'collaboration', 'team', 'project', 'start']
    },
    {
      id: 'action-join-team',
      title: 'Find Teams to Join',
      description: 'Browse open collaboration opportunities',
      icon: Users,
      action: () => navigate('/collaborations?filter=open'),
      category: 'actions',
      keywords: ['join', 'team', 'collaboration', 'opportunity', 'browse']
    },
    {
      id: 'action-search',
      title: 'Search Everything',
      description: 'Open advanced search',
      icon: Search,
      action: () => navigate('/search'),
      category: 'search',
      keywords: ['search', 'find', 'discover']
    },
  ], [navigate]);

  // Filter commands based on query
  const filteredCommands = useMemo(() => {
    if (!query) return commands;
    
    const lowercaseQuery = query.toLowerCase();
    return commands.filter(command => 
      command.title.toLowerCase().includes(lowercaseQuery) ||
      command.description?.toLowerCase().includes(lowercaseQuery) ||
      command.keywords.some(keyword => keyword.toLowerCase().includes(lowercaseQuery))
    );
  }, [commands, query]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredCommands.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
            onClose();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      // Focus input after animation
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Update selected index when filtered commands change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredCommands]);

  // Scroll selected item into view
  useEffect(() => {
    const selectedElement = listRef.current?.children[selectedIndex] as HTMLElement;
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: 'start' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Backdrop */}
      <div 
        data-testid="command-palette-backdrop"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Command Palette */}
      <div className="absolute inset-0 flex items-start justify-center pt-[15vh] px-4 pointer-events-none">
        <div className={cn(
          "w-full max-w-2xl mx-auto",
          "glassmorphic",
          "rounded-xl shadow-glass-lg",
          "animate-command-palette-in",
          "pointer-events-auto"
        )}>
          {/* Search Input */}
          <div className="flex items-center gap-3 p-4 border-b border-glass">
            <Command className="h-5 w-5 text-orange-500 dark:text-orange-400" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Type a command or search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={cn(
                "flex-1 bg-transparent text-gray-900 dark:text-gray-100",
                "placeholder-gray-500 dark:placeholder-gray-400",
                "border-none outline-none text-lg",
                "focus:placeholder-orange-400/60"
              )}
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-mono bg-white/30 dark:bg-white/10 rounded border border-white/20 dark:border-white/10 backdrop-blur-sm text-gray-700 dark:text-gray-300">
              ESC
            </kbd>
          </div>

          {/* Commands List */}
          <div 
            ref={listRef}
            className="max-h-96 overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent hover:scrollbar-thumb-white/30"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent'
            }}
          >
            {filteredCommands.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No commands found for "{query}"</p>
              </div>
            ) : (
              filteredCommands.map((command, index) => {
                const Icon = command.icon;
                const isSelected = index === selectedIndex;
                
                return (
                  <button
                    key={command.id}
                    onClick={() => {
                      command.action();
                      onClose();
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg",
                      "transition-all duration-300 transform",
                      isSelected 
                        ? "bg-white/20 dark:bg-white/10 shadow-lg shadow-orange-500/10 scale-[1.02]"
                        : "hover:bg-white/15 dark:hover:bg-white/8 hover:shadow-md hover:shadow-orange-500/5 hover:scale-[1.01]"
                    )}
                  >
                    <Icon className={cn(
                      "h-5 w-5 flex-shrink-0 transition-all duration-300",
                      isSelected ? "text-orange-500 scale-110" : "text-gray-400 group-hover:text-orange-400"
                    )} />
                    <div className="flex-1 min-w-0">
                      <div className={cn(
                        "font-semibold truncate transition-colors duration-300",
                        isSelected ? "text-orange-500 dark:text-orange-400" : "text-gray-100 dark:text-gray-50"
                      )}>
                        {command.title}
                      </div>
                      {command.description && (
                        <div className={cn(
                          "text-sm truncate transition-colors duration-300",
                          isSelected ? "text-orange-400/90 dark:text-orange-300/90" : "text-gray-300 dark:text-gray-300"
                        )}>
                          {command.description}
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <ArrowRight className="h-4 w-4 text-orange-500 flex-shrink-0 animate-pulse" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-glass bg-white/5 dark:bg-white/5 backdrop-blur-sm rounded-b-xl">
            <div className="flex items-center justify-between text-xs text-gray-300 dark:text-gray-300">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white/30 dark:bg-white/10 rounded border border-white/20 dark:border-white/10 backdrop-blur-sm font-mono text-gray-100 dark:text-gray-100">↑↓</kbd>
                  <span className="font-medium">Navigate</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white/30 dark:bg-white/10 rounded border border-white/20 dark:border-white/10 backdrop-blur-sm font-mono text-gray-100 dark:text-gray-100">↵</kbd>
                  <span className="font-medium">Select</span>
                </span>
              </div>
              <span className="font-medium text-gray-300 dark:text-gray-300">
                {filteredCommands.length} command{filteredCommands.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 