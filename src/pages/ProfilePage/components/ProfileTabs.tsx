import React, { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "../../../components/ui/Card";

type TabType =
  | "about"
  | "portfolio"
  | "gamification"
  | "collaborations"
  | "trades";

interface ProfileTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  tabRefs: React.MutableRefObject<Record<TabType, HTMLButtonElement | null>>;
  tabs: Array<{
    id: TabType;
    label: string;
    icon?: React.ReactNode;
    onHover?: () => void;
  }>;
  getTabCount?: (id: TabType) => number | undefined;
}

const ProfileTabsComponent: React.FC<ProfileTabsProps> = ({
  activeTab,
  onTabChange,
  tabRefs,
  tabs,
  getTabCount,
}) => {
  const tabScrollRef = useRef<HTMLDivElement | null>(null);
  const [tabHasOverflow, setTabHasOverflow] = useState(false);
  const [tabCanScrollLeft, setTabCanScrollLeft] = useState(false);
  const [tabCanScrollRight, setTabCanScrollRight] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Update tab scroll state
  const updateTabScrollState = useCallback(() => {
    const el = tabScrollRef.current;
    if (!el) return;
    const canLeft = el.scrollLeft > 0;
    const canRight = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
    setTabCanScrollLeft(canLeft);
    setTabCanScrollRight(canRight);
    setTabHasOverflow(el.scrollWidth > el.clientWidth + 1);
  }, []);

  // Handle keyboard navigation
  const handleTabKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    const ids = tabs.map((t) => t.id);
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const dir = e.key === "ArrowRight" ? 1 : -1;
      const nextIndex = (index + dir + ids.length) % ids.length;
      const nextId = ids[nextIndex];
      onTabChange(nextId);
      tabRefs.current[nextId]?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      onTabChange(ids[0]);
      tabRefs.current[ids[0]]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      const last = ids[ids.length - 1];
      onTabChange(last);
      tabRefs.current[last]?.focus();
    }
  };

  // Handle tab click
  const handleTabClick = (tab: { id: TabType; label: string }) => {
    onTabChange(tab.id);
    
    // Update hash for deep-linking
    try {
      window.history.replaceState({}, "", `#${tab.id}`);
    } catch {}
    
    // Save to localStorage
    try {
      localStorage.setItem("tradeya_profile_last_tab", tab.id);
    } catch {}
    
    // Scroll to panel
    const panel = document.getElementById(`panel-${tab.id}`);
    const behavior = prefersReducedMotion ? "auto" : "smooth";
    panel?.scrollIntoView({ behavior, block: "start" });
  };

  // Detect reduced motion preference
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applyPref = () => setPrefersReducedMotion(!!mediaQuery.matches);
    applyPref();
    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", applyPref);
      return () => mediaQuery.removeEventListener("change", applyPref);
    }
  }, []);

  // Observe tab scroller for overflow and scroll position changes
  useEffect(() => {
    const el = tabScrollRef.current;
    if (!el) return;
    const onScroll = () => updateTabScrollState();
    const onResize = () => updateTabScrollState();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(el);
    updateTabScrollState();
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      resizeObserver.disconnect();
    };
  }, [updateTabScrollState]);

  // Restore tab scroll position from localStorage
  useEffect(() => {
    try {
      const savedScroll = localStorage.getItem("tradeya_profile_tab_scroll");
      if (savedScroll && tabScrollRef.current) {
        tabScrollRef.current.scrollLeft = Number(savedScroll);
      }
    } catch {}
  }, []);

  return (
    <Card className="glassmorphic bg-white/5 backdrop-blur-sm rounded-lg border border-border/30 shadow-sm overflow-hidden">
      <div className="-mb-px sticky top-16 z-sticky glassmorphic backdrop-blur-xl bg-white/10">
        <div className="relative">
          {/* Left gradient fade */}
          <div
            className={`pointer-events-none absolute left-0 top-0 h-full w-6 bg-gradient-to-r from-white/10 to-transparent transition-opacity duration-200 ${
              tabHasOverflow && tabCanScrollLeft ? "opacity-100" : "opacity-0"
            }`}
          />
          
          {/* Right gradient fade */}
          <div
            className={`pointer-events-none absolute right-0 top-0 h-full w-6 bg-gradient-to-l from-white/10 to-transparent transition-opacity duration-200 ${
              tabHasOverflow && tabCanScrollRight ? "opacity-100" : "opacity-0"
            }`}
          />
          
          <div
            ref={tabScrollRef}
            className="overflow-x-auto scroll-smooth px-6 scrollbar-hide"
            role="tablist"
            aria-label="Profile sections"
            onScroll={() => {
              try {
                if (!tabScrollRef.current) return;
                localStorage.setItem(
                  "tradeya_profile_tab_scroll",
                  String(tabScrollRef.current.scrollLeft)
                );
              } catch {}
            }}
          >
            {/* Left scroll chevron */}
            <button
              type="button"
              className={`hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 items-center justify-center rounded-full border shadow-sm transition-opacity duration-200 ${
                tabHasOverflow
                  ? tabCanScrollLeft
                    ? "opacity-100 glassmorphic border-glass backdrop-blur-xl bg-white/10 hover:bg-white/15"
                    : "opacity-50 glassmorphic border-glass backdrop-blur-xl bg-white/5 cursor-not-allowed"
                  : "opacity-0 pointer-events-none"
              }`}
              onClick={() => {
                const scroller = tabScrollRef.current;
                const behavior = prefersReducedMotion ? "auto" : "smooth";
                scroller?.scrollBy({ left: -160, behavior });
              }}
              aria-label="Scroll tabs left"
              aria-hidden={!tabHasOverflow}
              tabIndex={tabHasOverflow ? 0 : -1}
              disabled={!tabHasOverflow || !tabCanScrollLeft}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            {/* Right scroll chevron */}
            <button
              type="button"
              className={`hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 items-center justify-center rounded-full border shadow-sm transition-opacity duration-200 ${
                tabHasOverflow
                  ? tabCanScrollRight
                    ? "opacity-100 glassmorphic border-glass backdrop-blur-xl bg-white/10 hover:bg-white/15"
                    : "opacity-50 glassmorphic border-glass backdrop-blur-xl bg-white/5 cursor-not-allowed"
                  : "opacity-0 pointer-events-none"
              }`}
              onClick={() => {
                const scroller = tabScrollRef.current;
                const behavior = prefersReducedMotion ? "auto" : "smooth";
                scroller?.scrollBy({ left: 160, behavior });
              }}
              aria-label="Scroll tabs right"
              aria-hidden={!tabHasOverflow}
              tabIndex={tabHasOverflow ? 0 : -1}
              disabled={!tabHasOverflow || !tabCanScrollRight}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            
            {/* Tab buttons */}
            <div className="flex gap-4">
              {tabs.map((tab, index) => (
                <button
                  key={tab.id}
                  role="tab"
                  id={tab.id}
                  aria-selected={activeTab === tab.id}
                  aria-controls={`panel-${tab.id}`}
                  tabIndex={activeTab === tab.id ? 0 : -1}
                  onMouseEnter={() => tab.onHover?.()}
                  onClick={() => handleTabClick(tab)}
                  onKeyDown={(e) => handleTabKeyDown(e, index)}
                  ref={(el) => {
                    (tabRefs.current as any)[tab.id] = el;
                  }}
                  className={`shrink-0 group relative whitespace-nowrap py-4 px-3 min-h-[44px] border-b-2 font-medium text-sm flex items-center gap-2 transition-colors duration-200 ${
                    activeTab === tab.id
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  }`}
                >
                  {tab.icon}
                  <span className="flex items-center gap-1">
                    {tab.label}
                    {getTabCount && typeof getTabCount(tab.id) === "number" && (
                      <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full glassmorphic border-glass backdrop-blur-xl bg-white/10 px-1 text-xs text-foreground">
                        {getTabCount(tab.id)}
                      </span>
                    )}
                  </span>
                  {/* Underline animation */}
                  <span
                    className={`absolute left-0 -bottom-[2px] h-[2px] bg-primary transition-all duration-300 ${
                      activeTab === tab.id
                        ? "w-full opacity-100"
                        : "w-0 opacity-0 group-hover:w-full"
                    }`}
                    aria-hidden="true"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export const ProfileTabs = React.memo(ProfileTabsComponent);
