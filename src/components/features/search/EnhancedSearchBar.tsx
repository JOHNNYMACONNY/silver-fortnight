import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  X,
  Sparkles,
  TrendingUp,
  Clock,
  Users,
  History,
  Trash2,
} from "lucide-react";
import { Input } from "../../ui/Input";
import { Button } from "../../ui/Button";
import { Badge } from "../../ui/Badge";
import { cn } from "../../../utils/cn";
import { classPatterns } from "../../../utils/designSystem";
import { semanticClasses } from "../../../utils/semanticColors";
import { useSearchHistory } from "../../../hooks/useSearchHistory";

interface EnhancedSearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSearch: (term: string, filters?: any) => void;
  onToggleFilters: () => void;
  hasActiveFilters: boolean;
  activeFiltersCount?: number;
  resultsCount: number;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
  topic?: "trades" | "collaboration" | "community" | "success";
  enableSearchHistory?: boolean;
  onSearchHistoryClear?: () => void;
}

export const EnhancedSearchBar: React.FC<EnhancedSearchBarProps> = ({
  searchTerm,
  onSearchChange,
  onSearch,
  onToggleFilters,
  hasActiveFilters,
  activeFiltersCount = 0,
  resultsCount,
  isLoading = false,
  placeholder = "Search collaborations by title, description, or participants...",
  className,
  topic = "trades",
  enableSearchHistory = true,
  onSearchHistoryClear,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get semantic colors for the topic
  const semanticClassesData = semanticClasses(topic);

  // Search history hook
  const { history, addToHistory, clearHistory } = useSearchHistory(10);

  // Popular search suggestions (fallback when no history)
  const suggestions = [
    "React Development",
    "UI/UX Design",
    "Mobile App Development",
    "Content Writing",
    "Digital Marketing",
    "Data Analysis",
  ];

  // Determine which suggestions to show
  const hasHistory = enableSearchHistory && history.length > 0;
  const displaySuggestions = hasHistory ? history : suggestions;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Let page-level debounced effects react to searchTerm changes.
    if (searchTerm.trim()) {
      if (enableSearchHistory) {
        addToHistory(searchTerm);
      }
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onSearchChange(suggestion);
    if (enableSearchHistory) {
      addToHistory(suggestion);
    }
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const handleClearHistory = () => {
    clearHistory();
    if (onSearchHistoryClear) {
      onSearchHistoryClear();
    }
  };

  const clearSearch = () => {
    onSearchChange("");
    inputRef.current?.focus();
  };

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Enhanced Search Bar */}
      <form onSubmit={handleSubmit} className="relative w-full">
        <div
          className={cn(
            "relative flex items-center w-full h-14 glassmorphic rounded-xl shadow-lg",
            isFocused && semanticClassesData.ring,
            "hover:shadow-xl transition-all duration-200",
            isFocused &&
              topic === "trades" &&
              "shadow-orange-500/20 shadow-xl border-orange-500/25",
            isFocused &&
              topic === "collaboration" &&
              "shadow-purple-500/20 shadow-xl border-purple-500/25",
            isFocused &&
              topic === "community" &&
              "shadow-blue-500/20 shadow-xl border-blue-500/25",
            isFocused &&
              topic === "success" &&
              "shadow-green-500/20 shadow-xl border-green-500/25"
          )}
        >
          {/* Search Icon */}
          <div className="absolute left-4">
            <motion.div
              animate={
                isFocused ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }
              }
              transition={{ duration: 0.2, type: "spring", stiffness: 300 }}
            >
              <Search
                className={cn(
                  "h-5 w-5 transition-colors duration-200",
                  isFocused ? semanticClassesData.text : "text-muted-foreground"
                )}
              />
            </motion.div>
          </div>

          {/* Input Field */}
          <Input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => {
              setIsFocused(true);
              setShowSuggestions(true);
            }}
            onBlur={() => {
              setIsFocused(false);
              setTimeout(() => setShowSuggestions(false), 150);
            }}
            placeholder={placeholder}
            className={cn(
              "h-full w-full pl-12 pr-20 text-base !border-0 !border-none bg-transparent text-foreground font-medium",
              "placeholder:text-muted-foreground/70 focus:ring-0 focus:border-0 focus:!border-0 focus:!border-none",
              "focus:outline-none focus:shadow-none hover:!border-0 hover:!border-none",
              "focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
            )}
          />

          {/* Clear Button */}
          <AnimatePresence>
            {searchTerm && (
              <motion.button
                type="button"
                onClick={clearSearch}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute right-16 p-1 rounded-full hover:bg-muted/20 transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Filter Button */}
          <Button
            type="button"
            variant={hasActiveFilters ? "default" : "ghost"}
            size="sm"
            onClick={onToggleFilters}
            className={cn(
              "absolute right-2 h-10 w-10 rounded-full transition-all duration-200",
              hasActiveFilters
                ? cn(semanticClassesData.bgSolid, "text-white shadow-lg")
                : "hover:bg-muted/20"
            )}
            aria-label={
              hasActiveFilters
                ? `${activeFiltersCount} filters active. Open filters`
                : "Open filters"
            }
            title={
              hasActiveFilters
                ? `${activeFiltersCount} filters active`
                : "Open filters"
            }
          >
            <Filter className="h-4 w-4" />
            {hasActiveFilters && activeFiltersCount > 0 && (
              <motion.span
                className={cn(
                  "absolute -top-1 -right-1 min-w-[16px] min-h-[16px] px-1 rounded-full bg-background text-[10px] leading-[16px] border",
                  semanticClassesData.text,
                  semanticClassesData.bgSubtle
                )}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {Math.min(activeFiltersCount, 9)}
              </motion.span>
            )}
          </Button>
        </div>
      </form>

      {/* Search Suggestions */}
      <AnimatePresence>
        {showSuggestions && isFocused && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full glassmorphic rounded-xl shadow-lg p-4"
          >
            {hasHistory ? (
              <>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <History className={cn("h-4 w-4", semanticClassesData.text)} />
                    <span className="text-sm font-medium text-foreground">
                      Recent searches
                    </span>
                  </div>
                  {enableSearchHistory && history.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearHistory}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                      title="Clear search history"
                    >
                      <Trash2 className="h-3 w-3" />
                      Clear
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {displaySuggestions.map((suggestion, index) => (
                    <motion.button
                      key={`${suggestion}-${index}`}
                      type="button"
                      onClick={() => handleSuggestionClick(suggestion)}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="text-left p-2 rounded-md hover:bg-muted/20 transition-colors text-sm text-muted-foreground hover:text-foreground"
                    >
                      {suggestion}
                    </motion.button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className={cn("h-4 w-4", semanticClassesData.text)} />
                  <span className="text-sm font-medium text-foreground">
                    Popular searches
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {displaySuggestions.map((suggestion, index) => (
                    <motion.button
                      key={suggestion}
                      type="button"
                      onClick={() => handleSuggestionClick(suggestion)}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="text-left p-2 rounded-md hover:bg-muted/20 transition-colors text-sm text-muted-foreground hover:text-foreground"
                    >
                      {suggestion}
                    </motion.button>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Summary */}
      <AnimatePresence>
        {(searchTerm || hasActiveFilters) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full glassmorphic rounded-lg p-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Sparkles
                    className={cn("h-4 w-4", semanticClassesData.text)}
                  />
                  <span className="text-sm font-medium text-foreground">
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <motion.div
                          className={cn(
                            "h-4 w-4 border-2 border-t-transparent rounded-full",
                            semanticClassesData.text
                          )}
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        />
                        Searching...
                      </span>
                    ) : (
                      `${resultsCount} result${
                        resultsCount !== 1 ? "s" : ""
                      } found`
                    )}
                  </span>
                </div>

                {hasActiveFilters && activeFiltersCount > 0 && (
                  <Badge
                    variant="secondary"
                    className={cn(semanticClassesData.badge)}
                  >
                    <Filter className="h-3 w-3 mr-1" />
                    {activeFiltersCount} filter
                    {activeFiltersCount === 1 ? "" : "s"}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Real-time</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
