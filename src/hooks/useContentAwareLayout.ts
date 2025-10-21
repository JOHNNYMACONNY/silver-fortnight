
import { useState, useEffect, RefObject } from 'react';

type ContentType = 'feature' | 'stats' | 'integration' | 'media' | 'text' | 'mixed';
type OptimalSize = 'small' | 'large';

interface ContentAnalysis {
  optimalSize: OptimalSize;
  textLength: number;
  imageCount: number;
  interactiveElementCount: number;
}

const CONTENT_TYPE_WEIGHTS = {
  feature: { text: 1.5, images: 1.2, interactive: 1.1 },
  stats: { text: 0.8, images: 0.5, interactive: 1.2 },
  integration: { text: 1, images: 1, interactive: 1.5 },
  media: { text: 0.7, images: 1.5, interactive: 0.8 },
  text: { text: 1.2, images: 0.8, interactive: 1 },
  mixed: { text: 1, images: 1, interactive: 1 },
};

export function useContentAwareLayout(
  ref: RefObject<HTMLElement>,
  contentType: ContentType = 'mixed'
): ContentAnalysis | null {
  const [analysis, setAnalysis] = useState<ContentAnalysis | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver(() => {
      const textLength = element.textContent?.length || 0;
      const imageCount = element.getElementsByTagName('img').length;
      const interactiveElementCount = element.querySelectorAll('button, a, input, select, textarea').length;

      const weights = CONTENT_TYPE_WEIGHTS[contentType];
      const score =
        textLength * weights.text +
        imageCount * weights.images * 100 + // Give more weight to images
        interactiveElementCount * weights.interactive * 50; // And interactive elements

      // This is a simple heuristic. A more complex implementation could
      // analyze aspect ratios, element density, etc.
      const optimalSize = score > 500 ? 'large' : 'small';

      setAnalysis({
        optimalSize,
        textLength,
        imageCount,
        interactiveElementCount,
      });
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [ref, contentType]);

  return analysis;
}
