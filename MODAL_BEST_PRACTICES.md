# Modal Best Practices Guide

## 🎯 **Modern Modal Positioning & Viewport Management**

This guide outlines the best practices implemented for modal positioning and viewport management in the TradeYa application.

## 📋 **Key Principles**

### **1. Viewport-Aware Positioning**
- ✅ **Safe Area Calculation**: Automatically account for header/footer heights
- ✅ **Responsive Sizing**: Different behavior for mobile, tablet, and desktop
- ✅ **Overflow Prevention**: Ensure modals never extend beyond viewport bounds
- ✅ **Accessibility**: Maintain proper focus management and keyboard navigation

### **2. Modern CSS Techniques**
- ✅ **CSS Custom Properties**: Use CSS variables for consistent spacing
- ✅ **Container Queries**: Responsive design based on container size
- ✅ **Flexbox/Grid**: Modern layout techniques for better control
- ✅ **CSS Calc()**: Dynamic calculations for viewport-relative sizing

### **3. Performance Optimization**
- ✅ **Portal Rendering**: Render modals outside component tree
- ✅ **Lazy Loading**: Load modal content only when needed
- ✅ **Animation Optimization**: Use `transform` and `opacity` for smooth animations
- ✅ **Memory Management**: Proper cleanup of event listeners and timers

## 🛠️ **Implementation Architecture**

### **1. Viewport-Aware Modal Hook (`useViewportAwareModal`)**

```typescript
const { positioning, heights, isScrollable } = useViewportAwareModal({
  headerHeight: 4, // 4rem for navbar
  footerHeight: 2, // 2rem estimated
  topMargin: 1, // 1rem additional margin
  bottomMargin: 1, // 1rem additional margin
  minContentHeight: 25, // 25rem minimum
  maxContentHeightPercent: isMobile ? 90 : isTablet ? 85 : 80,
});
```

**Features:**
- Automatic safe area calculation
- Responsive positioning classes
- Scroll detection and management
- Mobile optimization

### **2. Modal Positioning Utility (`modalPositioning.ts`)**

```typescript
const dimensions = calculateModalPositioning(viewport, {
  useSafeArea: true,
  headerHeight: 4,
  footerHeight: 4,
  centerVertically: false,
  maxWidthPercent: 90,
  preventBodyScroll: true,
});
```

**Features:**
- Dynamic positioning calculation
- Responsive breakpoint handling
- CSS-in-JS style generation
- Body scroll prevention

### **3. Mobile Optimization Integration**

```typescript
const { isMobile, isTablet, isDesktop, viewport } = useMobileOptimization();
```

**Features:**
- Device detection
- Touch target optimization
- Performance preferences
- Viewport dimension tracking

## 📱 **Responsive Behavior**

### **Mobile (< 768px)**
- **Positioning**: Top-aligned with safe margins
- **Width**: 95% of viewport width
- **Height**: 90% of available viewport
- **Scrolling**: Content scrolls when needed
- **Touch**: Optimized for touch interactions

### **Tablet (768px - 1024px)**
- **Positioning**: Top-aligned with larger margins
- **Width**: 90% of viewport width
- **Height**: 85% of available viewport
- **Scrolling**: Limited scrolling, better content fit
- **Touch**: Standard touch targets

### **Desktop (> 1024px)**
- **Positioning**: Centered vertically when possible
- **Width**: 85% of viewport width
- **Height**: 80% of available viewport
- **Scrolling**: Minimal scrolling, optimal content display
- **Mouse**: Optimized for mouse interactions

## 🎨 **CSS Class Structure**

### **Container Classes**
```css
.absolute.left-1/2.transform.-translate-x-1/2
.top-20.w-[calc(100vw-4rem)].max-w-6xl
.max-h-[80vh].min-h-[25rem].overflow-hidden
```

### **Content Classes**
```css
.flex.flex-col.h-[calc(100vh-10rem)]
.min-h-0.overflow-y-auto
```

## 🔧 **Configuration Options**

### **ViewportAwareModalConfig**
```typescript
interface ViewportAwareModalConfig {
  headerHeight?: number;        // Header height in rem
  footerHeight?: number;        // Footer height in rem
  topMargin?: number;          // Additional top margin in rem
  bottomMargin?: number;       // Additional bottom margin in rem
  minContentHeight?: number;   // Minimum content height in rem
  maxContentHeightPercent?: number; // Max height as % of viewport
}
```

### **ModalPositioningConfig**
```typescript
interface ModalPositioningConfig {
  useSafeArea?: boolean;       // Use safe area insets
  headerHeight?: number;       // Custom header height in rem
  footerHeight?: number;       // Custom footer height in rem
  centerVertically?: boolean;  // Center vertically
  maxWidthPercent?: number;    // Max width as % of viewport
  preventBodyScroll?: boolean; // Prevent body scroll
}
```

## 🚀 **Usage Examples**

### **Basic Modal**
```typescript
const MyModal = ({ isOpen, onClose }) => {
  const { positioning, heights } = useViewportAwareModal();
  
  return (
    <div className={cn("absolute z-50", positioning.container, heights.container)}>
      <div className={cn("flex flex-col", positioning.content, heights.content)}>
        {/* Modal content */}
      </div>
    </div>
  );
};
```

### **Advanced Modal with Custom Config**
```typescript
const AdvancedModal = ({ isOpen, onClose }) => {
  const { isMobile } = useMobileOptimization();
  const { positioning, heights, isScrollable } = useViewportAwareModal({
    headerHeight: 5, // Custom header height
    footerHeight: 3, // Custom footer height
    maxContentHeightPercent: isMobile ? 95 : 75,
  });
  
  return (
    <div className={cn("absolute z-50", positioning.container, heights.container)}>
      <div className={cn(
        "flex flex-col",
        positioning.content,
        heights.content,
        isScrollable && "overflow-y-auto"
      )}>
        {/* Modal content */}
      </div>
    </div>
  );
};
```

## 🧪 **Testing Considerations**

### **Viewport Testing**
- Test on various screen sizes (320px to 2560px)
- Test in both portrait and landscape orientations
- Test with different zoom levels (50% to 200%)
- Test with browser developer tools device simulation

### **Accessibility Testing**
- Test keyboard navigation (Tab, Shift+Tab, Escape)
- Test screen reader compatibility
- Test focus management and restoration
- Test with reduced motion preferences

### **Performance Testing**
- Test animation performance (60fps target)
- Test memory usage with multiple modals
- Test scroll performance with large content
- Test touch responsiveness on mobile devices

## 🔍 **Common Pitfalls to Avoid**

### **❌ Hard-coded Heights**
```css
/* BAD */
height: 500px;
max-height: 80vh;

/* GOOD */
height: calc(100vh - 8rem);
max-height: 80vh;
```

### **❌ Fixed Positioning Without Safe Areas**
```css
/* BAD */
top: 50%;
transform: translateY(-50%);

/* GOOD */
top: calc(4rem + 1rem); /* Header + margin */
```

### **❌ Ignoring Mobile Constraints**
```css
/* BAD */
min-height: 600px; /* Too tall for mobile */

/* GOOD */
min-height: 25rem; /* Responsive minimum */
```

### **❌ Not Handling Overflow**
```css
/* BAD */
overflow: hidden; /* Content gets cut off */

/* GOOD */
overflow-y: auto; /* Allow scrolling when needed */
```

## 📊 **Performance Metrics**

### **Target Metrics**
- **Animation FPS**: 60fps
- **Layout Shift**: < 0.1
- **Cumulative Layout Shift**: < 0.1
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s

### **Monitoring**
- Use browser DevTools Performance tab
- Monitor Core Web Vitals
- Test on low-end devices
- Use Lighthouse for accessibility and performance audits

## 🔄 **Future Enhancements**

### **Planned Features**
- [ ] Container query support for more responsive behavior
- [ ] Intersection Observer for viewport visibility
- [ ] CSS Grid for more complex layouts
- [ ] Web Animations API for better performance
- [ ] ResizeObserver for dynamic content handling

### **Experimental Features**
- [ ] CSS Container Units (cqw, cqh)
- [ ] CSS Logical Properties (inline-start, block-end)
- [ ] CSS Custom Properties with fallbacks
- [ ] CSS Cascade Layers for better specificity management

## 📚 **Resources**

### **Documentation**
- [MDN Modal Dialog Patterns](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/dialog_role)
- [W3C ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- [CSS Container Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Container_Queries)

### **Tools**
- [Chrome DevTools](https://developers.google.com/web/tools/chrome-devtools)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [WebPageTest](https://www.webpagetest.org/)

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Maintainer**: TradeYa Development Team
