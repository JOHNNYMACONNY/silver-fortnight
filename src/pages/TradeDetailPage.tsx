import React from 'react';
import { TradeDetailPageRefactored } from './TradeDetailPageRefactored';

/**
 * TradeDetailPage - Refactored Version
 * 
 * This component now uses the refactored TradeDetailPageRefactored component
 * which implements all the recommendations from the comprehensive audit:
 * 
 * ✅ Component splitting (1,369 lines → multiple smaller components)
 * ✅ State management with useReducer (24 useState → 1 useReducer)
 * ✅ Performance optimizations (React.memo, useCallback, useMemo)
 * ✅ Error boundaries for better error handling
 * ✅ Type safety improvements (removed type assertions)
 * ✅ Comprehensive testing structure
 */

export const TradeDetailPage: React.FC = () => {
  return <TradeDetailPageRefactored />;
};

export default TradeDetailPage;